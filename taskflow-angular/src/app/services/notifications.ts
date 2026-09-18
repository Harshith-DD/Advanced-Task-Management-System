import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

export interface NotificationItem {
  _id:string; type:string; message:string; read:boolean; createdAt:string;
  task?: { title:string; status:string; priority:string };
}

@Injectable({providedIn:'root'})
export class NotificationService {
  private readonly http=inject(HttpClient);
  readonly notifications=signal<NotificationItem[]>([]);
  readonly unreadCount=computed(()=>this.notifications().filter(n=>!n.read).length);

  load(){return this.http.get<{success:boolean;data:NotificationItem[]}>(`${API_BASE_URL}/notifications`)
    .subscribe({next:r=>this.notifications.set(r.data)});}
  getNotifications(){return this.http.get<{success:boolean;data:NotificationItem[]}>(`${API_BASE_URL}/notifications`);}
  markRead(id:string){return this.http.patch<{success:boolean;data:NotificationItem}>(`${API_BASE_URL}/notifications/${id}/read`,{});}
  markAllRead(){return this.http.patch<{success:boolean;data:unknown}>(`${API_BASE_URL}/notifications/read-all`,{});}
}
