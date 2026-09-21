import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

export interface DashboardActivityProject {
  name: string;
  key: string;
}

export interface DashboardActivityTask {
  title: string;
  taskKey: string;
  status: string;
  priority: string;
  project?: DashboardActivityProject;
}

export interface DashboardActivity {
  _id: string;
  action?: string;
  message?: string;
  createdAt: string;
  user?: { name: string; email: string };
  task?: DashboardActivityTask;
}

export interface DashboardProjectStats {
  total: number;
  active: number;
  empty: number;
}

export interface DashboardData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: { low: number; medium: number; high: number };
  projects: DashboardProjectStats;
  recentActivity: DashboardActivity[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  getDashboard() {
    return this.http.get<{success:boolean;data:DashboardData}>(`${API_BASE_URL}/dashboard`);
  }
}
