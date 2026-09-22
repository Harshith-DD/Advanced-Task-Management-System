import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityItem, ActivityService } from '../services/activity';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-activity',
  imports: [DatePipe, MatIconModule, MatCardModule],
  templateUrl: './activity.html',
  styleUrl: './activity.css'
})
export class Activity implements OnInit {
  private readonly service = inject(ActivityService);

  readonly items = signal<ActivityItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getActivities().subscribe({
      next: response => {
        this.items.set(response.data);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(
          error?.error?.error?.message ??
          error?.error?.message ??
          'Failed to load activity.'
        );
        this.loading.set(false);
      }
    });
  }
}
