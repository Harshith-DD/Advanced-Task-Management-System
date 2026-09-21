import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from '../api-config';

export interface ActivityProject {
  name: string;
  key: string;
}

export interface ActivityTask {
  title: string;
  taskKey: string;
  status: string;
  priority: string;
  project?: ActivityProject;
}

export interface ActivityItem {
  _id: string;
  type?: string;
  action?: string;
  message?: string;
  createdAt: string;
  user?: { name: string; email: string };
  task?: ActivityTask;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);

  getActivities() {
    return this.http.get<{
      success: boolean;
      data: ActivityItem[];
    }>(`${API_BASE_URL}/activities`);
  }
}
