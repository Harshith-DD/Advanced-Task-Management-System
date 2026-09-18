import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

export interface ActivityItem {
  _id: string;
  action?: string;
  message?: string;
  createdAt: string;
  user?: { name: string; email: string };
  task?: { title: string; status: string; priority: string };
}

@Injectable({providedIn:'root'})
export class ActivityService {
  private readonly http=inject(HttpClient);
  getActivities(){ return this.http.get<{success:boolean;data:ActivityItem[]}>(`${API_BASE_URL}/activities`); }
}
