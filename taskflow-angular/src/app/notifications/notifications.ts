import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationItem, NotificationService } from '../services/notifications';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
  readonly service = inject(NotificationService);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.refresh().subscribe({
      next: () => this.loading.set(false),
      error: error => {
        this.error.set(this.getErrorMessage(error, 'Failed to load notifications.'));
        this.loading.set(false);
      }
    });
  }

  markRead(notification: NotificationItem): void {
    this.error.set('');

    this.service.markRead(notification._id).subscribe({
      error: error => this.error.set(
        this.getErrorMessage(error, 'Failed to mark notification as read.')
      )
    });
  }

  markAll(): void {
    this.error.set('');

    this.service.markAllRead().subscribe({
      error: error => this.error.set(
        this.getErrorMessage(error, 'Failed to mark notifications as read.')
      )
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.error?.message ?? error?.error?.message ?? fallback;
  }
}
