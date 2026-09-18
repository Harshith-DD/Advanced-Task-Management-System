import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  Task
} from '../task';

import {
  TaskService
} from '../services/task';

import {
  TaskCard
} from '../task-card/task-card';

@Component({
  selector: 'app-tasks',
  imports: [
    TaskCard
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks implements OnInit {
  tasks = signal<Task[]>([]);

  isLoading = signal(false);

  errorMessage = signal('');

  constructor(
    private readonly taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.taskService.getTasks().subscribe({
      next: tasks => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },

      error: error => {
        console.error(
          'Failed to load tasks:',
          error
        );

        this.errorMessage.set(
          error.status === 401
            ? 'Please log in to view your tasks.'
            : 'Failed to load tasks.'
        );

        this.isLoading.set(false);
      }
    });
  }
}