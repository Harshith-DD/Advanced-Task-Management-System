import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardData } from '../services/dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly service = inject(DashboardService);
  readonly dashboard = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.service.getDashboard().subscribe({
      next: response => { this.dashboard.set(response.data); this.loading.set(false); },
      error: error => { this.error.set(error?.error?.error?.message ?? 'Failed to load dashboard.'); this.loading.set(false); }
    });
  }
}
