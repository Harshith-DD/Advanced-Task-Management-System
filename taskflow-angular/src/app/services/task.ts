import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  API_BASE_URL
} from '../api-config';

import {
  Task,
  TaskFilters
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
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${API_BASE_URL}/tasks`;

  getTasks(
    filters: TaskFilters = {}
  ): Observable<Task[]> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set(
        'status',
        filters.status
      );
    }

    if (filters.priority) {
      params = params.set(
        'priority',
        filters.priority
      );
    }

    if (filters.search) {
      params = params.set(
        'search',
        filters.search
      );
    }

    if (filters.tag) {
      params = params.set(
        'tag',
        filters.tag
      );
    }

    if (filters.fromDate) {
      params = params.set(
        'fromDate',
        filters.fromDate
      );
    }

    if (filters.toDate) {
      params = params.set(
        'toDate',
        filters.toDate
      );
    }

    if (filters.sortBy) {
      params = params.set(
        'sortBy',
        filters.sortBy
      );
    }

    if (filters.sortOrder) {
      params = params.set(
        'sortOrder',
        filters.sortOrder
      );
    }

    if (filters.page !== undefined) {
      params = params.set(
        'page',
        filters.page
      );
    }

    if (filters.limit !== undefined) {
      params = params.set(
        'limit',
        filters.limit
      );
    }

    return this.http
      .get<TasksResponse>(
        this.apiUrl,
        { params }
      )
      .pipe(
        map(response => response.data)
      );
  }
}