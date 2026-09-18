import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, ActivityItem } from '../services/activity';

@Component({selector:'app-activity',imports:[CommonModule],templateUrl:'./activity.html',styleUrl:'./activity.css'})
export class Activity implements OnInit {
  private readonly service=inject(ActivityService);
  readonly items=signal<ActivityItem[]>([]);
  readonly loading=signal(true);
  readonly error=signal('');
  ngOnInit(){this.service.getActivities().subscribe({
    next:r=>{this.items.set(r.data);this.loading.set(false)},
    error:e=>{this.error.set(e?.error?.error?.message??'Failed to load activity.');this.loading.set(false)}
  })}
}
