import { Injectable, computed, signal } from '@angular/core';
import { Task, TaskFilters, TaskPagination } from '../task';

@Injectable({ providedIn: 'root' })
export class TaskStateService {
  readonly tasks = signal<Task[]>([]);
  readonly filters = signal<TaskFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  readonly pagination = signal<TaskPagination>({
    page: 1, limit: 10, totalTasks: 0, totalPages: 0
  });
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly hasTasks = computed(() => this.tasks().length > 0);
  readonly hasError = computed(() => !!this.errorMessage());

  setTasks(tasks: Task[]): void { this.tasks.set(tasks); }
  setPagination(value: TaskPagination): void { this.pagination.set(value); }
  setFilters(value: TaskFilters): void { this.filters.set(value); }
  patchFilters(value: Partial<TaskFilters>): void {
    this.filters.update(current => ({ ...current, ...value }));
  }
  setLoading(value: boolean): void { this.isLoading.set(value); }
  setError(value: string): void { this.errorMessage.set(value); }
  clearError(): void { this.errorMessage.set(''); }

  reset(): void {
    this.tasks.set([]);
    this.filters.set({
      page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc'
    });
    this.pagination.set({
      page: 1, limit: 10, totalTasks: 0, totalPages: 0
    });
    this.isLoading.set(false);
    this.errorMessage.set('');
  }
}
