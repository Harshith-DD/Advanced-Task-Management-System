import {
  Component,
  OnInit
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
  tasks: Task[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  private loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasks().subscribe({
      next: tasks => {
        this.tasks = tasks;
        this.isLoading = false;
      },

      error: error => {
        console.error(
          'Failed to load tasks:',
          error
        );

        this.errorMessage =
          error.status === 401
            ? 'Please log in to view your tasks.'
            : 'Failed to load tasks.';

        this.isLoading = false;
      }
    });
  }
}