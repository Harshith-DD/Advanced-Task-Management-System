import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';

export type NotificationType =
  | 'taskAssigned'
  | 'taskCompleted'
  | 'taskPriorityChanged'
  | 'taskReminder';

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  task?: {
    title: string;
    status: string;
    priority: string;
  };
}

interface NotificationResponse {
  success: boolean;
  data: NotificationItem[];
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/notifications`;

  readonly notifications = signal<NotificationItem[]>([]);

  readonly unreadCount = computed(
    () =>
      this.notifications().filter(
        notification => !notification.read
      ).length
  );

  /**
   * Fetch notifications from the backend and update
   * the shared Angular notification state.
   */
  refresh(): Observable<NotificationItem[]> {
    return this.http
      .get<NotificationResponse>(this.apiUrl)
      .pipe(
        map(response => response.data),
        tap(notifications => this.notifications.set(notifications))
      );
  }

  /**
   * Load is kept as a separate semantic method because
   * the application shell uses it during initialization.
   */
  load(): Observable<NotificationItem[]> {
    return this.refresh();
  }

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(this.apiUrl);
  }

  markRead(
    id: string
  ): Observable<{ success: boolean; data: NotificationItem }> {
    return this.http
      .patch<{ success: boolean; data: NotificationItem }>(
        `${this.apiUrl}/${id}/read`,
        {}
      )
      .pipe(
        tap(response => {
          this.notifications.update(items =>
            items.map(item =>
              item._id === id ? response.data : item
            )
          );
        })
      );
  }

  markAllRead(): Observable<{ success: boolean; data: unknown }> {
    return this.http
      .patch<{ success: boolean; data: unknown }>(
        `${this.apiUrl}/read-all`,
        {}
      )
      .pipe(
        tap(() => {
          this.notifications.update(items =>
            items.map(item => ({
              ...item,
              read: true
            }))
          );
        })
      );
  }

  clear(): void {
    this.notifications.set([]);
  }
}