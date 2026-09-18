import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { CreateTaskRequest, Task, TaskFilters, TaskListResponse, UpdateTaskRequest, UserListResponse } from '../task';

export interface TaskMutationResponse { success: boolean; data: Task; }
export interface DeleteTaskResponse { success: boolean; message: string; }

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/tasks`;
  private readonly usersUrl = `${API_BASE_URL}/users`;

  getTasks(filters: TaskFilters = {}): Observable<TaskListResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<TaskListResponse>(this.apiUrl, { params });
  }

  createTask(taskData: CreateTaskRequest): Observable<TaskMutationResponse> {
    return this.http.post<TaskMutationResponse>(this.apiUrl, taskData);
  }

  updateTask(taskId: string, taskData: UpdateTaskRequest): Observable<TaskMutationResponse> {
    return this.http.put<TaskMutationResponse>(`${this.apiUrl}/${taskId}`, taskData);
  }

  deleteTask(taskId: string): Observable<DeleteTaskResponse> {
    return this.http.delete<DeleteTaskResponse>(`${this.apiUrl}/${taskId}`);
  }

  assignTask(taskId: string, assignedTo: string | null): Observable<TaskMutationResponse> {
    return this.http.patch<TaskMutationResponse>(`${this.apiUrl}/${taskId}/assign`, { assignedTo });
  }

  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(this.usersUrl);
  }
}
