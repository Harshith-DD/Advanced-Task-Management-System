import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  TaskCard
} from '../task-card/task-card';

import {
  TaskService
} from '../services/task';

import {
  TaskStateService
} from '../services/task-state';

@Component({
  selector: 'app-tasks',

  imports: [
    TaskCard
  ],

  templateUrl: './tasks.html',

  styleUrl: './tasks.css'
})
export class Tasks implements OnInit {
  protected readonly taskState =
    inject(TaskStateService);

  private readonly taskService =
    inject(TaskService);

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.taskState.setLoading(true);
    this.taskState.clearError();

    this.taskService
      .getTasks()
      .subscribe({
        next: tasks => {
          this.taskState.setTasks(tasks);
          this.taskState.setLoading(false);
        },

        error: error => {
          console.error(
            'Failed to load tasks:',
            error
          );

          this.taskState.setError(
            error.status === 401
              ? 'Please log in to view your tasks.'
              : 'Failed to load tasks.'
          );

          this.taskState.setLoading(false);
        }
      });
  }
}