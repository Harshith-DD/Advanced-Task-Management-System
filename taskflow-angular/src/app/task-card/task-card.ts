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

  get currentUserRole(): string | null {
    return this.auth.currentUser()?.role ?? null;
  }

  get isAdmin(): boolean {
    return this.currentUserRole === 'admin';
  }

  get isOwner(): boolean {
    return !!this.currentUserId && this.task().owner?._id === this.currentUserId;
  }

  get isAssignedUser(): boolean {
    return !!this.currentUserId && this.task().assignedTo?._id === this.currentUserId;
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

  get permissionLabel(): string {
    if (this.isAdmin) return 'Administrator';
    if (this.isOwner) return 'You are the owner';
    if (this.isAssignedUser) return 'Assigned to you';
    return 'View access';
  }

  get permissionDetails(): string {
    const permissions: string[] = [];
    if (this.canEdit) permissions.push('Can edit');
    if (this.canAssign) permissions.push('Can assign');
    if (this.canDelete) permissions.push('Can delete');
    return permissions.join(' · ');
  }

  get ownerLabel(): string {
    const owner = this.task().owner;
    if (!owner) return 'Unknown';
    return owner._id === this.currentUserId ? `${owner.name} (You)` : owner.name;
  }

  get assignedLabel(): string {
    const assigned = this.task().assignedTo;
    if (!assigned) return 'Unassigned';
    return assigned._id === this.currentUserId ? `${assigned.name} (You)` : assigned.name;
  }

  onAssignmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assignmentChange.emit({
      task: this.task(),
      assignedTo: value || null
    });
  }
}
