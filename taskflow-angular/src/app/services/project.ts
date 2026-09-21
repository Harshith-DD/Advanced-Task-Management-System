import {
  Injectable,
  inject
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
  CreateProjectRequest,
  Project,
  ProjectListResponse,
  UpdateProjectRequest
} from '../project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${API_BASE_URL}/projects`;

  getProjects(): Observable<ProjectListResponse> {
    return this.http.get<ProjectListResponse>(
      this.apiUrl
    );
  }

  getProject(
    projectId: string
  ): Observable<{
    success: boolean;
    data: Project;
  }> {
    return this.http.get<{
      success: boolean;
      data: Project;
    }>(
      `${this.apiUrl}/${projectId}`
    );
  }

  createProject(
    project: CreateProjectRequest
  ): Observable<{
    success: boolean;
    data: Project;
  }> {
    return this.http.post<{
      success: boolean;
      data: Project;
    }>(
      this.apiUrl,
      project
    );
  }

  updateProject(
    projectId: string,
    project: UpdateProjectRequest
  ): Observable<{
    success: boolean;
    data: Project;
  }> {
    return this.http.put<{
      success: boolean;
      data: Project;
    }>(
      `${this.apiUrl}/${projectId}`,
      project
    );
  }

  deleteProject(
    projectId: string
  ): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
    }>(
      `${this.apiUrl}/${projectId}`
    );
  }
}