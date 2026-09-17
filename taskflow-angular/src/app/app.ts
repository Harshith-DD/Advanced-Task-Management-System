import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskCard } from './task-card/task-card';
@Component({
  imports: [RouterOutlet,TaskCard],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('TaskFlow');

  protected readonly taskCount = signal(3);

  protected readonly isLoggedIn = signal(true);

protected readonly tasks = signal([
  { title: 'Build dashboard', status: 'pending' },
  { title: 'Fix notifications', status: 'completed' },
  { title: 'Create reports', status: 'pending' },
]);

  protected incrementTaskCount() {
    this.taskCount.update(count => count + 1);
  }
  protected addTask() {
  this.tasks.update(tasks => [
    ...tasks,
    {
      title: `New Task ${tasks.length + 1}`,
      status: 'pending'
    }
  ]);

  this.taskCount.update(count => count + 1);
}
}

