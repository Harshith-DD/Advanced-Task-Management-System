import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import {
  Task,
  TaskFilters
} from '../task';

@Injectable({
  providedIn: 'root'
})
export class TaskStateService {
  readonly tasks =
    signal<Task[]>([]);

  readonly filters =
    signal<TaskFilters>({});

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly hasTasks =
    computed(() =>
      this.tasks().length > 0
    );

  readonly taskCount =
    computed(() =>
      this.tasks().length
    );

  readonly hasError =
    computed(() =>
      this.errorMessage().length > 0
    );

  setTasks(tasks: Task[]): void {
    this.tasks.set(tasks);
  }

  setFilters(filters: TaskFilters): void {
    this.filters.set(filters);
  }

  setLoading(isLoading: boolean): void {
    this.isLoading.set(isLoading);
  }

  setError(message: string): void {
    this.errorMessage.set(message);
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  clearTasks(): void {
    this.tasks.set([]);
  }

  reset(): void {
    this.tasks.set([]);
    this.filters.set({});
    this.isLoading.set(false);
    this.errorMessage.set('');
  }
}