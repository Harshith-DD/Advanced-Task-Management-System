import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import {
  CreateTaskRequest,
  Task,
  TaskFilters,
  TaskListResponse,
  UpdateTaskRequest,
  UserListResponse
} from '../task';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/tasks`;
  private readonly usersUrl = `${API_BASE_URL}/users`;

  getTasks(filters: TaskFilters = {}): Observable<TaskListResponse> {
    let params = new HttpParams();
    const entries = Object.entries(filters);

    for (const [key, value] of entries) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<TaskListResponse>(this.apiUrl, { params });
  }

  createTask(taskData: CreateTaskRequest): Observable<{ success: boolean; data: Task }> {
    return this.http.post<{ success: boolean; data: Task }>(
      this.apiUrl,
      taskData
    );
  }

  updateTask(taskId: string, taskData: UpdateTaskRequest): Observable<{ success: boolean; data: Task }> {
    return this.http.put<{ success: boolean; data: Task }>(
      `${this.apiUrl}/${taskId}`,
      taskData
    );
  }

  deleteTask(taskId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${taskId}`
    );
  }

  assignTask(taskId: string, assignedTo: string | null): Observable<{ success: boolean; data: Task }> {
    return this.http.patch<{ success: boolean; data: Task }>(
      `${this.apiUrl}/${taskId}/assign`,
      { assignedTo }
    );
  }

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(this.usersUrl);
  }
}
