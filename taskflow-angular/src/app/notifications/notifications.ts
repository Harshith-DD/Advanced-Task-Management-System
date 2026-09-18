import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import {
  NotificationItem,
  NotificationService
} from '../services/notifications';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class Notifications
  implements OnInit, OnDestroy
{
  readonly service = inject(NotificationService);

  readonly loading = signal(false);
  readonly error = signal('');

  private readonly destroy$ =
    new Subject<void>();

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set('');

    this.service
      .loadIfNeeded()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },

        error: error => {
          console.error(
            'Failed to load notifications:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to load notifications.'
            )
          );

          this.loading.set(false);
        }
      });
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');

    this.service
      .refresh()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },

        error: error => {
          console.error(
            'Failed to refresh notifications:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to refresh notifications.'
            )
          );

          this.loading.set(false);
        }
      });
  }

  markRead(notification: NotificationItem): void {
    this.error.set('');

    this.service
      .markRead(notification._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to mark notification as read:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to mark notification as read.'
            )
          );
        }
      });
  }

  markAll(): void {
    this.error.set('');

    this.service
      .markAllRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to mark notifications as read:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to mark notifications as read.'
            )
          );
        }
      });
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      typeof error === 'object' &&
      error !== null
    ) {
      const candidate = error as {
        error?: {
          error?: {
            message?: string;
          };
          message?: string;
        };
      };

      return (
        candidate.error?.error?.message ??
        candidate.error?.message ??
        fallback
      );
    }

    return fallback;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}