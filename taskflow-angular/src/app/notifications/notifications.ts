import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationItem } from '../services/notifications';

@Component({selector:'app-notifications',imports:[CommonModule],templateUrl:'./notifications.html',styleUrl:'./notifications.css'})
export class Notifications implements OnInit {
  readonly service=inject(NotificationService);
  readonly items=signal<NotificationItem[]>([]);
  readonly loading=signal(true);
  readonly error=signal('');

  ngOnInit(){this.reload();}
  reload(){this.loading.set(true);this.service.getNotifications().subscribe({
    next:r=>{this.items.set(r.data);this.loading.set(false)},
    error:e=>{this.error.set(e?.error?.error?.message??'Failed to load notifications.');this.loading.set(false)}
  });}
  markRead(id:string){this.service.markRead(id).subscribe({next:()=>this.reload(),error:e=>this.error.set(e?.error?.error?.message??'Failed to mark notification as read.')});}
  markAll(){this.service.markAllRead().subscribe({next:()=>this.reload(),error:e=>this.error.set(e?.error?.error?.message??'Failed to mark notifications as read.')});}
}
