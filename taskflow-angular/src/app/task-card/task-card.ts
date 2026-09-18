import { Component, EventEmitter, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskPriority, TaskStatus, TaskUser } from '../task';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css'
})
export class TaskCard {
  readonly task = input.required<Task>();

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{ task: Task; status: TaskStatus }>();
  @Output() priorityChange = new EventEmitter<{ task: Task; priority: TaskPriority }>();
  @Output() assignmentChange = new EventEmitter<{ task: Task; assignedTo: string | null }>();

  readonly statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];
  readonly priorities: TaskPriority[] = ['low', 'medium', 'high'];

  trackUser(_: number, user: TaskUser): string { return user._id; }
}
