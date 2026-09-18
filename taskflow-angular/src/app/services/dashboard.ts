import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

export interface DashboardActivity {
  _id: string;
  action?: string;
  message?: string;
  createdAt: string;
  user?: { name: string; email: string };
  task?: { title: string; status: string; priority: string };
}

export interface DashboardData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: { low: number; medium: number; high: number };
  recentActivity: DashboardActivity[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  getDashboard() {
    return this.http.get<{success:boolean;data:DashboardData}>(`${API_BASE_URL}/dashboard`);
  }
}
