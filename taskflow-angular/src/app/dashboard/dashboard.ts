import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardData, DashboardService } from '../services/dashboard';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatProgressBarModule, MatCardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly service = inject(DashboardService);

  readonly dashboard = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getDashboard().subscribe({
      next: response => {
        this.dashboard.set(response.data);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(
          error?.error?.error?.message ??
          error?.error?.message ??
          'Failed to load dashboard.'
        );
        this.loading.set(false);
      }
    });
  }
}
