import {
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  API_BASE_URL
} from '../api-config';

import {
  Task
} from '../task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${API_BASE_URL}/tasks`;

  constructor(
    private readonly http: HttpClient
  ) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(
      this.apiUrl
    );
  }
}