import {
  Component,
  EventEmitter,
  inject,
  input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AuthService } from '../services/auth';

import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUser
} from '../task';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatFormFieldModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css'
})
export class TaskCard {
  private readonly auth = inject(AuthService);

  readonly task = input.required<Task>();
  readonly users = input<TaskUser[]>([]);

  @Output()
  view = new EventEmitter<Task>();

  @Output()
  edit = new EventEmitter<Task>();

  @Output()
  delete = new EventEmitter<Task>();

  @Output()
  statusChange =
    new EventEmitter<{
      task: Task;
      status: TaskStatus;
    }>();

  @Output()
  priorityChange =
    new EventEmitter<{
      task: Task;
      priority: TaskPriority;
    }>();

  @Output()
  assignmentChange =
    new EventEmitter<{
      task: Task;
      assignedTo: string | null;
    }>();

  readonly statuses: TaskStatus[] = [
    'pending',
    'in-progress',
    'completed'
  ];

  readonly priorities: TaskPriority[] = [
    'low',
    'medium',
    'high'
  ];

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
    return (
      !!this.currentUserId &&
      this.task().owner?._id === this.currentUserId
    );
  }

  get isAssignedUser(): boolean {
    return (
      !!this.currentUserId &&
      this.task().assignedTo?._id === this.currentUserId
    );
  }

  get isProjectOwner(): boolean {
    return (
      !!this.currentUserId &&
      this.task().project?.owner?._id === this.currentUserId
    );
  }

  get canEdit(): boolean {
    return (
      this.isAdmin ||
      this.isOwner ||
      this.isProjectOwner ||
      this.isAssignedUser
    );
  }

  get canDelete(): boolean {
    return (
      this.isAdmin ||
      this.isOwner ||
      this.isProjectOwner
    );
  }

  get canAssign(): boolean {
    return (
      this.isAdmin ||
      this.isOwner ||
      this.isProjectOwner
    );
  }

  get permissionLabel(): string {
    if (this.isAdmin) {
      return 'Administrator';
    }

    if (this.isOwner) {
      return 'You are the task owner';
    }

    if (this.isProjectOwner) {
      return 'You own this project';
    }

    if (this.isAssignedUser) {
      return 'Assigned to you';
    }

    return 'View access';
  }

  get permissionDetails(): string {
    const permissions: string[] = [];

    if (this.canEdit) {
      permissions.push('Can edit');
    }

    if (this.canAssign) {
      permissions.push('Can assign');
    }

    if (this.canDelete) {
      permissions.push('Can delete');
    }

    return permissions.join(' · ');
  }

  get ownerLabel(): string {
    const owner = this.task().owner;

    if (!owner) {
      return 'Unknown';
    }

    return owner._id === this.currentUserId
      ? `${owner.name} (You)`
      : owner.name;
  }

  get assignedLabel(): string {
    const assigned = this.task().assignedTo;

    if (!assigned) {
      return 'Unassigned';
    }

    return assigned._id === this.currentUserId
      ? `${assigned.name} (You)`
      : assigned.name;
  }

  onStatusChange(event: Event): void {
    const target =
      event.target as HTMLSelectElement;

    const status = target.value;

    if (
      !this.statuses.includes(
        status as TaskStatus
      )
    ) {
      return;
    }

    this.statusChange.emit({
      task: this.task(),
      status: status as TaskStatus
    });
  }

  onPriorityChange(event: Event): void {
    const target =
      event.target as HTMLSelectElement;

    const priority = target.value;

    if (
      !this.priorities.includes(
        priority as TaskPriority
      )
    ) {
      return;
    }

    this.priorityChange.emit({
      task: this.task(),
      priority: priority as TaskPriority
    });
  }

  onAssignmentChange(event: Event): void {
    const target =
      event.target as HTMLSelectElement;

    this.assignmentChange.emit({
      task: this.task(),
      assignedTo:
        target.value || null
    });
  }
}