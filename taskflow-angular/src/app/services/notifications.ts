import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';

export type NotificationType =
  | 'taskAssigned'
  | 'taskUnassigned'
  | 'taskCompleted'
  | 'taskPriorityChanged'
  | 'taskReminder';

export interface NotificationProject {
  name: string;
  key: string;
}

export interface NotificationTask {
  title: string;
  taskKey: string;
  status: string;
  priority: string;
  project?: NotificationProject;
}

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  task?: NotificationTask;
}

interface NotificationResponse {
  success: boolean;
  data: NotificationItem[];
}

interface MarkNotificationReadResponse {
  success: boolean;
  data: NotificationItem;
}

interface MarkAllNotificationsReadResponse {
  success: boolean;
  data: {
    modifiedCount?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/notifications`;

  readonly notifications = signal<NotificationItem[]>([]);

  readonly hasLoaded = signal(false);

  readonly unreadCount = computed(
    () =>
      this.notifications().filter(
        notification => !notification.read
      ).length
  );

  load(): Observable<NotificationItem[]> {
    return this.http
      .get<NotificationResponse>(this.apiUrl)
      .pipe(
        map(response => response.data),
        tap(notifications => {
          this.notifications.set(notifications);
          this.hasLoaded.set(true);
        })
      );
  }

  refresh(): Observable<NotificationItem[]> {
    return this.load();
  }

  loadIfNeeded(): Observable<NotificationItem[]> {
    if (this.hasLoaded()) {
      return new Observable(subscriber => {
        subscriber.next(this.notifications());
        subscriber.complete();
      });
    }

    return this.load();
  }

  markRead(
    id: string
  ): Observable<MarkNotificationReadResponse> {
    return this.http
      .patch<MarkNotificationReadResponse>(
        `${this.apiUrl}/${id}/read`,
        {}
      )
      .pipe(
        tap(response => {
          this.notifications.update(items =>
            items.map(item =>
              item._id === id
                ? response.data
                : item
            )
          );
        })
      );
  }

  markAllRead(): Observable<MarkAllNotificationsReadResponse> {
    return this.http
      .patch<MarkAllNotificationsReadResponse>(
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
    this.hasLoaded.set(false);
  }
}