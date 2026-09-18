import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth';
import { Task, TaskPriority, TaskStatus, TaskUser } from '../task';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css'
})
export class TaskCard {
  private readonly auth = inject(AuthService);

  readonly task = input.required<Task>();
  readonly users = input<TaskUser[]>([]);

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{ task: Task; status: TaskStatus }>();
  @Output() priorityChange = new EventEmitter<{ task: Task; priority: TaskPriority }>();
  @Output() assignmentChange = new EventEmitter<{ task: Task; assignedTo: string | null }>();

  readonly statuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];
  readonly priorities: TaskPriority[] = ['low', 'medium', 'high'];

  get currentUserId(): string | null {
    return this.auth.currentUser()?.id ?? null;
  }

  get isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  get isOwner(): boolean {
    const ownerId = this.task().owner?._id;
    return !!ownerId && ownerId === this.currentUserId;
  }

  get isAssignedUser(): boolean {
    const assignedId = this.task().assignedTo?._id;
    return !!assignedId && assignedId === this.currentUserId;
  }

  get canEdit(): boolean {
    return this.isAdmin || this.isOwner || this.isAssignedUser;
  }

  get canDelete(): boolean {
    return this.isAdmin || this.isOwner;
  }

  get canAssign(): boolean {
    return this.isAdmin || this.isOwner;
  }

  get ownerLabel(): string {
    const owner = this.task().owner?.name ?? 'Unknown';
    return this.isOwner ? `${owner} (You)` : owner;
  }

  get assignedLabel(): string {
    const assigned = this.task().assignedTo;
    if (!assigned) return 'Unassigned';
    return assigned._id === this.currentUserId
      ? `${assigned.name} (You)`
      : assigned.name;
  }

  trackUser(_: number, user: TaskUser): string {
    return user._id;
  }

  onAssignmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assignmentChange.emit({
      task: this.task(),
      assignedTo: value || null
    });
  }
}
