import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, Subject, takeUntil } from 'rxjs';
import { Task, TaskFilters, TaskPriority, TaskStatus, TaskUser } from '../task';
import { TaskCard } from '../task-card/task-card';
import { TaskForm, TaskFormSubmit } from '../task-form/task-form';
import { TaskService } from '../services/task';
import { TaskStateService } from '../services/task-state';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule, ReactiveFormsModule, TaskCard, TaskForm],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit, OnDestroy {
  protected readonly taskState = inject(TaskStateService);
  private readonly taskService = inject(TaskService);
  private readonly destroy$ = new Subject<void>();

  readonly users = signal<TaskUser[]>([]);
  readonly isFormOpen = signal(false);
  readonly isSaving = signal(false);
  readonly editingTask = signal<Task | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<TaskStatus | ''>('', { nonNullable: true });
  readonly priorityControl = new FormControl<TaskPriority | ''>('', { nonNullable: true });
  readonly tagControl = new FormControl('', { nonNullable: true });
  readonly fromDateControl = new FormControl('', { nonNullable: true });
  readonly toDateControl = new FormControl('', { nonNullable: true });
  readonly sortByControl = new FormControl<'createdAt'|'updatedAt'|'dueDate'|'priority'>('createdAt', { nonNullable: true });
  readonly sortOrderControl = new FormControl<'asc'|'desc'>('desc', { nonNullable: true });

  readonly visibleTasks = signal<Task[]>([]);

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(search => this.applyFilters({ search }));

    for (const control of [
      this.statusControl, this.priorityControl, this.tagControl,
      this.fromDateControl, this.toDateControl,
      this.sortByControl, this.sortOrderControl
    ]) {
      control.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => this.applyAllFilters());
    }

    this.loadUsers();
    this.loadTasks();
  }

  private loadUsers(): void {
    this.taskService.getUsers().subscribe({
      next: response => this.users.set(response.data),
      error: error => console.error('Failed to load users:', error)
    });
  }

  loadTasks(): void {
    this.taskState.setLoading(true);
    this.taskState.clearError();

    this.taskService.getTasks(this.taskState.filters()).pipe(
      finalize(() => this.taskState.setLoading(false)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        this.taskState.setTasks(response.data);
        this.taskState.setPagination(response.pagination);
      },
      error: error => {
        console.error('Failed to load tasks:', error);
        this.taskState.setError(
          error?.error?.error?.message ??
          error?.error?.message ??
          (error.status === 401 ? 'Please log in to view your tasks.' : 'Failed to load tasks.')
        );
      }
    });
  }

  private applyFilters(patch: Partial<TaskFilters>): void {
    this.taskState.patchFilters({ ...patch, page: 1 });
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
      ? this.taskService.updateTask(editing._id, {
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          dueDate: value.dueDate,
          tags: value.tags
        })
      : this.taskService.createTask({
          title: value.title,
          description: value.description,
          status: value.status,
          priority: value.priority,
          dueDate: value.dueDate,
          tags: value.tags
        });

    request.subscribe({
      next: response => {
        const taskId = response.data._id;
        const previousAssignment = editing?.assignedTo?._id ?? null;
        const assignmentChanged = previousAssignment !== value.assignedTo;

        // A newly-created task starts unassigned. Only call the separate
        // assignment endpoint when the requested assignment is non-null.
        // For an existing task, call it whenever the assignment changed,
        // including changing an assignee to Unassigned.
        const shouldAssign = editing
          ? assignmentChanged
          : value.assignedTo !== null;

        if (!shouldAssign) {
          this.afterMutation();
          this.isSaving.set(false);
          return;
        }

        this.taskService.assignTask(taskId, value.assignedTo).subscribe({
          next: () => {
            this.afterMutation();
            this.isSaving.set(false);
          },
          error: error => {
            console.error('Assignment failed:', error);
            this.taskState.setError(
              error?.error?.error?.message ??
              'Task saved, but assignment failed.'
            );
            this.isSaving.set(false);
          }
        });
      },
      error: error => {
        console.error('Failed to save task:', error);
        this.taskState.setError(
          error?.error?.error?.message ??
          error?.error?.message ??
          'Failed to save task.'
        );
        this.isSaving.set(false);
      }
    });
  }

  changeStatus(event: {task: Task; status: TaskStatus}): void {
    this.taskService.updateTask(event.task._id, { status: event.status })
      .subscribe({
        next: () => this.loadTasks(),
        error: error => this.taskState.setError(error?.error?.error?.message ?? 'Failed to update status.')
      });
  }

  changeAssignment(event: { task: Task; assignedTo: string | null }): void {
    this.taskService.assignTask(event.task._id, event.assignedTo).subscribe({
      next: () => this.loadTasks(),
      error: error => this.taskState.setError(
        error?.error?.error?.message ?? 'Failed to update assignment.'
      )
    });
  }

  changePriority(event: {task: Task; priority: TaskPriority}): void {
    this.taskService.updateTask(event.task._id, { priority: event.priority })
      .subscribe({
        next: () => this.loadTasks(),
        error: error => this.taskState.setError(error?.error?.error?.message ?? 'Failed to update priority.')
      });
  }

  deleteTask(task: Task): void {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(task._id).subscribe({
      next: () => this.loadTasks(),
      error: error => this.taskState.setError(error?.error?.error?.message ?? 'Failed to delete task.')
    });
  }

  goToPage(page: number): void {
    const p = this.taskState.pagination();
    if (page < 1 || page > p.totalPages) return;
    this.taskState.patchFilters({ page });
    this.loadTasks();
  }

  changeLimit(limit: number): void {
    this.taskState.patchFilters({ limit, page: 1 });
    this.loadTasks();
  }

  private afterMutation(): void {
    this.isFormOpen.set(false);
    this.editingTask.set(null);
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
