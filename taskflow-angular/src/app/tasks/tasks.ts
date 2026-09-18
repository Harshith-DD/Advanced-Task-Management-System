import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import {
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  TaskUser
} from '../task';

import { TaskCard } from '../task-card/task-card';
import {
  TaskForm,
  TaskFormSubmit
} from '../task-form/task-form';

import { TaskService } from '../services/task';
import { TaskStateService } from '../services/task-state';
import { NotificationService } from '../services/notifications';
import { AuthService } from '../services/auth';

type TaskView = 'list' | 'kanban';

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TaskCard,
    TaskForm
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit, OnDestroy {
  protected readonly taskState = inject(TaskStateService);

  private readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);

  protected readonly authService = inject(AuthService);

  private readonly destroy$ = new Subject<void>();

  readonly users = signal<TaskUser[]>([]);
  readonly isFormOpen = signal(false);
  readonly isSaving = signal(false);
  readonly editingTask = signal<Task | null>(null);

  readonly taskView = signal<TaskView>(
    this.getInitialTaskView()
  );

  readonly isKanbanMaximized = signal(false);

  readonly pageNumbers = computed(() =>
    Array.from(
      {
        length: this.taskState.pagination().totalPages
      },
      (_, index) => index + 1
    )
  );

  readonly kanbanColumns: Array<{
    status: TaskStatus;
    title: string;
    description: string;
  }> = [
    {
      status: 'pending',
      title: 'Pending',
      description: 'Not started'
    },
    {
      status: 'in-progress',
      title: 'In progress',
      description: 'Currently active'
    },
    {
      status: 'completed',
      title: 'Completed',
      description: 'Finished work'
    }
  ];

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly statusControl =
    new FormControl<TaskStatus | ''>('', {
      nonNullable: true
    });

  readonly priorityControl =
    new FormControl<TaskPriority | ''>('', {
      nonNullable: true
    });

  readonly tagControl = new FormControl('', {
    nonNullable: true
  });

  readonly fromDateControl = new FormControl('', {
    nonNullable: true
  });

  readonly toDateControl = new FormControl('', {
    nonNullable: true
  });

  readonly sortByControl =
    new FormControl<TaskFilters['sortBy']>(
      'createdAt',
      {
        nonNullable: true
      }
    );

  readonly sortOrderControl =
    new FormControl<'asc' | 'desc'>(
      'asc',
      {
        nonNullable: true
      }
    );

  private taskRequestId = 0;
  private draggedTaskId: string | null = null;

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(search => {
        this.applyFilters({
          search: search.trim()
        });
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.priorityControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.fromDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.toDateControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.sortByControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.sortOrderControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyAllFilters());

    this.loadUsers();
    this.loadTasks();
  }

  private getInitialTaskView(): TaskView {
    try {
      return localStorage.getItem(
        'taskflow-task-view'
      ) === 'list'
        ? 'list'
        : 'kanban';
    } catch {
      return 'kanban';
    }
  }

  setTaskView(view: TaskView): void {
    this.taskView.set(view);

    if (view === 'list') {
      this.isKanbanMaximized.set(false);
    }

    try {
      localStorage.setItem(
        'taskflow-task-view',
        view
      );
    } catch {
      // Ignore unavailable local storage.
    }
  }

  toggleKanbanMaximized(): void {
    this.isKanbanMaximized.update(
      value => !value
    );
  }

  private loadUsers(): void {
    this.taskService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.users.set(response.data);
        },
        error: error => {
          console.error(
            'Failed to load users:',
            error
          );
        }
      });
  }

  loadTasks(): void {
    const requestId = ++this.taskRequestId;

    this.taskState.setLoading(true);
    this.taskState.clearError();

    this.taskService
      .getTasks(this.taskState.filters())
      .pipe(
        finalize(() => {
          if (requestId === this.taskRequestId) {
            this.taskState.setLoading(false);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {
          if (requestId !== this.taskRequestId) {
            return;
          }

          const uniqueTasks = Array.from(
            new Map(
              response.data.map(task => [
                String(task._id),
                task
              ])
            ).values()
          );

          this.taskState.setTasks(uniqueTasks);
          this.taskState.setPagination(
            response.pagination
          );
        },

        error: error => {
          if (requestId !== this.taskRequestId) {
            return;
          }

          console.error(
            'Failed to load tasks:',
            error
          );

          this.taskState.setError(
            error?.error?.error?.message ??
            error?.error?.message ??
            (
              error.status === 401
                ? 'Please log in to view your tasks.'
                : 'Failed to load tasks.'
            )
          );
        }
      });
  }

  private applyFilters(
    patch: Partial<TaskFilters>
  ): void {
    this.taskState.patchFilters({
      ...patch,
      page: 1
    });

    this.loadTasks();
  }

  private applyAllFilters(): void {
    this.taskState.patchFilters({
      status: this.statusControl.value,
      priority: this.priorityControl.value,
      tag: this.tagControl.value.trim(),
      fromDate: this.fromDateControl.value,
      toDate: this.toDateControl.value,
      sortBy: this.sortByControl.value,
      sortOrder: this.sortOrderControl.value,
      page: 1
    });

    this.loadTasks();
  }

  applyTagFilter(): void {
    this.applyFilters({
      tag: this.tagControl.value.trim()
    });
  }

  openCreate(): void {
    this.editingTask.set(null);
    this.isFormOpen.set(true);
  }

  openEdit(task: Task): void {
    this.editingTask.set(task);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    if (!this.isSaving()) {
      this.isFormOpen.set(false);
      this.editingTask.set(null);
    }
  }

  saveTask(value: TaskFormSubmit): void {
    this.isSaving.set(true);
    this.taskState.clearError();

    const editing = this.editingTask();

    const request = editing
      ? this.taskService.updateTask(
          editing._id,
          {
            title: value.title,
            description: value.description,
            status: value.status,
            priority: value.priority,
            dueDate: value.dueDate,
            tags: value.tags
          }
        )
      : this.taskService.createTask({
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          dueDate: value.dueDate,
          tags: value.tags
        });

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          /*
           * The backend already returns the authoritative
           * updated/created task.
           *
           * Put that task into the Angular state immediately
           * so the UI does not remain stale.
           */
          this.replaceTaskInState(response.data);

          const taskId = response.data._id;

          const previousAssignment =
            editing?.assignedTo?._id ?? null;

          const assignmentChanged =
            previousAssignment !== value.assignedTo;

          const shouldAssign = editing
            ? assignmentChanged
            : value.assignedTo !== null;

          const notificationMayHaveChanged =
            editing
              ? editing.status !== value.status ||
                editing.priority !== value.priority ||
                assignmentChanged
              : value.assignedTo !== null;

          if (!shouldAssign) {
            this.afterMutation(
              notificationMayHaveChanged
            );
            return;
          }

          this.taskService
            .assignTask(
              taskId,
              value.assignedTo
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: assignmentResponse => {
                /*
                 * Assignment endpoint also returns the
                 * authoritative updated task.
                 */
                this.replaceTaskInState(
                  assignmentResponse.data
                );

                this.afterMutation(
                  notificationMayHaveChanged
                );
              },

              error: error => {
                console.error(
                  'Assignment failed:',
                  error
                );

                this.taskState.setError(
                  error?.error?.error?.message ??
                  'Task saved, but assignment failed.'
                );

                this.isSaving.set(false);
              }
            });
        },

        error: error => {
          console.error(
            'Failed to save task:',
            error
          );

          this.taskState.setError(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to save task.'
          );

          this.isSaving.set(false);
        }
      });
  }

  changeStatus(event: {
    task: Task;
    status: TaskStatus;
  }): void {
    this.updateAndRefresh(
      event.task._id,
      { status: event.status },
      'Failed to update status.',
      true
    );
  }

  changeAssignment(event: {
    task: Task;
    assignedTo: string | null;
  }): void {
    this.taskService
      .assignTask(
        event.task._id,
        event.assignedTo
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          this.replaceTaskInState(
            response.data
          );

          this.refreshAfterMutation(true);
        },

        error: error => {
          this.taskState.setError(
            error?.error?.error?.message ??
            'Failed to update assignment.'
          );
        }
      });
  }

  changePriority(event: {
    task: Task;
    priority: TaskPriority;
  }): void {
    this.updateAndRefresh(
      event.task._id,
      { priority: event.priority },
      'Failed to update priority.',
      true
    );
  }

  deleteTask(task: Task): void {
    if (
      !window.confirm(
        'Are you sure you want to delete this task?'
      )
    ) {
      return;
    }

    this.taskService
      .deleteTask(task._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          /*
           * Remove it immediately from the local state.
           * The subsequent GET still re-applies the active
           * filters and pagination.
           */
          this.taskState.setTasks(
            this.taskState.tasks().filter(
              item => item._id !== task._id
            )
          );

          this.refreshAfterMutation();
        },

        error: error => {
          this.taskState.setError(
            error?.error?.error?.message ??
            'Failed to delete task.'
          );
        }
      });
  }

  private updateAndRefresh(
    taskId: string,
    data: Partial<
      Pick<Task, 'status' | 'priority'>
    >,
    fallback: string,
    refreshNotifications = false
  ): void {
    this.taskService
      .updateTask(taskId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          /*
           * IMPORTANT:
           * Use the task returned by the backend.
           *
           * This fixes the stale Angular UI after
           * status/priority updates.
           */
          this.replaceTaskInState(
            response.data
          );

          /*
           * Then reload normally so backend filtering,
           * pagination, sorting and overdue calculations
           * remain authoritative.
           */
          this.refreshAfterMutation(
            refreshNotifications
          );
        },

        error: error => {
          this.taskState.setError(
            error?.error?.error?.message ??
            fallback
          );
        }
      });
  }

  private replaceTaskInState(
    updatedTask: Task
  ): void {
    const currentTasks =
      this.taskState.tasks();

    const exists = currentTasks.some(
      task => task._id === updatedTask._id
    );

    if (!exists) {
      return;
    }

    this.taskState.setTasks(
      currentTasks.map(task =>
        task._id === updatedTask._id
          ? updatedTask
          : task
      )
    );
  }

  private refreshAfterMutation(
    refreshNotifications = false
  ): void {
    this.loadTasks();

    if (!refreshNotifications) {
      return;
    }

    /*
     * Notification creation is handled by the existing
     * backend event/job system. Refresh the shared Angular
     * notification state after the mutation request succeeds.
     */
    this.notificationService
      .refresh()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to refresh notifications:',
            error
          );
        }
      });
  }

  goToPage(page: number): void {
    const pagination =
      this.taskState.pagination();

    if (
      page < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    this.taskState.patchFilters({
      page
    });

    this.loadTasks();
  }

  changeLimit(limit: number): void {
    this.taskState.patchFilters({
      limit,
      page: 1
    });

    this.loadTasks();
  }

  tasksForStatus(
    status: TaskStatus
  ): Task[] {
    return this.taskState
      .tasks()
      .filter(task => task.status === status);
  }

  canDrag(task: Task): boolean {
    const currentUser =
      this.authService.currentUser();

    if (!currentUser) {
      return false;
    }

    return (
      currentUser.role === 'admin' ||
      task.owner?._id === currentUser.id ||
      task.assignedTo?._id === currentUser.id
    );
  }

  onDragStart(
    event: DragEvent,
    task: Task
  ): void {
    if (
      !this.canDrag(task) ||
      (
        event.target as HTMLElement
      )?.closest(
        'button, select, input, textarea, a'
      )
    ) {
      event.preventDefault();
      return;
    }

    this.draggedTaskId = task._id;

    event.dataTransfer?.setData(
      'text/plain',
      task._id
    );

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.draggedTaskId = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(
    event: DragEvent,
    nextStatus: TaskStatus
  ): void {
    event.preventDefault();

    const taskId =
      this.draggedTaskId ??
      event.dataTransfer?.getData(
        'text/plain'
      );

    this.draggedTaskId = null;

    if (!taskId) {
      return;
    }

    const task =
      this.taskState.tasks().find(
        item => item._id === taskId
      );

    if (
      !task ||
      !this.canDrag(task) ||
      task.status === nextStatus
    ) {
      return;
    }

    /*
     * Keep the existing optimistic Kanban movement
     * so drag/drop remains responsive.
     */
    this.taskState.setTasks(
      this.taskState.tasks().map(item =>
        item._id === taskId
          ? {
              ...item,
              status: nextStatus
            }
          : item
      )
    );

    this.taskService
      .updateTask(
        taskId,
        { status: nextStatus }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          /*
           * Replace the optimistic object with the
           * authoritative backend response.
           */
          this.replaceTaskInState(
            response.data
          );

          this.refreshAfterMutation(true);
        },

        error: error => {
          this.taskState.setError(
            error?.error?.error?.message ??
            'Failed to move task.'
          );

          this.loadTasks();
        }
      });
  }

  @HostListener(
    'document:keydown.escape'
  )
  handleEscape(): void {
    if (this.isFormOpen()) {
      this.closeForm();
    } else if (
      this.isKanbanMaximized()
    ) {
      this.isKanbanMaximized.set(false);
    }
  }

  private afterMutation(
    refreshNotifications = false
  ): void {
    this.isFormOpen.set(false);
    this.editingTask.set(null);
    this.isSaving.set(false);

    this.refreshAfterMutation(
      refreshNotifications
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}