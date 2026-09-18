import {
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  API_BASE_URL
} from '../api-config';

import {
  Task
} from '../task';

interface TasksResponse {
  success: boolean;
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    totalTasks: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl =
    `${API_BASE_URL}/tasks`;

  constructor(
    private readonly http: HttpClient
  ) {}

  getTasks(): Observable<Task[]> {
    return this.http
      .get<TasksResponse>(this.apiUrl)
      .pipe(
        map(response => response.data)
      );
  }
}