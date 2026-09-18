import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, switchMap, takeUntil } from 'rxjs';
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
  readonly sortByControl = new FormControl<'createdAt' | 'updatedAt' | 'dueDate' | 'priority'>('createdAt', { nonNullable: true });
  readonly sortOrderControl = new FormControl<'asc' | 'desc'>('desc', { nonNullable: true });

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(search => this.applyFilters({ search: search.trim() }));

    [this.statusControl, this.priorityControl, this.tagControl, this.fromDateControl,
      this.toDateControl, this.sortByControl, this.sortOrderControl]
      .forEach(control => control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.applyAllFilters()));

    this.loadUsers();
    this.loadTasks();
  }

  private loadUsers(): void {
    this.taskService.getUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: response => this.users.set(response.data),
      error: error => console.error('Failed to load users:', error)
    });
  }

  loadTasks(): void {
    this.taskState.setLoading(true);
    this.taskState.clearError();
    this.taskService.getTasks(this.taskState.filters()).pipe(
      takeUntil(this.destroy$), finalize(() => this.taskState.setLoading(false))
    ).subscribe({
      next: response => {
        this.taskState.setTasks(response.data);
        this.taskState.setPagination(response.pagination);
      },
      error: error => this.taskState.setError(this.getErrorMessage(error, 'Failed to load tasks.'))
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.error?.message ?? error?.error?.message ??
      (error?.status === 401 ? 'Please log in to view your tasks.' : fallback);
  }

  private applyFilters(patch: Partial<TaskFilters>): void {
    this.taskState.patchFilters({ ...patch, page: 1 });
    this.loadTasks();
  }

  private applyAllFilters(): void {
    this.taskState.patchFilters({
      status: this.statusControl.value, priority: this.priorityControl.value,
      tag: this.tagControl.value.trim(), fromDate: this.fromDateControl.value,
      toDate: this.toDateControl.value, sortBy: this.sortByControl.value,
      sortOrder: this.sortOrderControl.value, page: 1
    });
    this.loadTasks();
  }

  openCreate(): void { this.editingTask.set(null); this.isFormOpen.set(true); }
  openEdit(task: Task): void { this.editingTask.set(task); this.isFormOpen.set(true); }

  closeForm(): void {
    if (!this.isSaving()) { this.isFormOpen.set(false); this.editingTask.set(null); }
  }

  saveTask(value: TaskFormSubmit): void {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    this.taskState.clearError();
    const editing = this.editingTask();

    const request = editing
      ? this.taskService.updateTask(editing._id, {
          title: value.title, description: value.description, status: value.status,
          priority: value.priority, dueDate: value.dueDate, tags: value.tags
        })
      : this.taskService.createTask({
          title: value.title, description: value.description, status: value.status,
          priority: value.priority, dueDate: value.dueDate, tags: value.tags
        });

    request.pipe(
      switchMap(response => this.taskService.assignTask(response.data._id, value.assignedTo)),
      takeUntil(this.destroy$),
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => this.afterMutation(),
      error: error => this.taskState.setError(this.getErrorMessage(error, 'Failed to save task.'))
    });
  }

  changeStatus(event: { task: Task; status: TaskStatus }): void {
    this.taskService.updateTask(event.task._id, { status: event.status }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadTasks(),
      error: error => this.taskState.setError(this.getErrorMessage(error, 'Failed to update status.'))
    });
  }

  changePriority(event: { task: Task; priority: TaskPriority }): void {
    this.taskService.updateTask(event.task._id, { priority: event.priority }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadTasks(),
      error: error => this.taskState.setError(this.getErrorMessage(error, 'Failed to update priority.'))
    });
  }

  deleteTask(task: Task): void {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    this.taskService.deleteTask(task._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadTasks(),
      error: error => this.taskState.setError(this.getErrorMessage(error, 'Failed to delete task.'))
    });
  }

  goToPage(page: number): void {
    const pagination = this.taskState.pagination();
    if (page < 1 || page > pagination.totalPages || page === pagination.page) return;
    this.taskState.patchFilters({ page });
    this.loadTasks();
  }

  changeLimit(limit: number): void {
    if (!Number.isFinite(limit) || limit < 1) return;
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
