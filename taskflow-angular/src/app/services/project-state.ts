import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError
} from 'rxjs';

import {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest
} from '../project';

import { ProjectService } from './project';

@Injectable({
  providedIn: 'root'
})
export class ProjectStateService {
  private readonly projectService =
    inject(ProjectService);

  readonly projects =
    signal<Project[]>([]);

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal('');

  load(): Observable<Project[]> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.projectService
      .getProjects()
      .pipe(
        tap(response => {
          this.projects.set(
            response.data
          );
        }),

        map(response =>
          response.data
        ),

        catchError(error => {
          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to load projects.'
          );

          return throwError(
            () => error
          );
        }),

        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }

  create(
    project: CreateProjectRequest
  ): Observable<Project> {
    this.errorMessage.set('');

    return this.projectService
      .createProject(project)
      .pipe(
        tap(response => {
          this.projects.update(
            current => [
              ...current,
              response.data
            ]
          );
        }),

        map(response =>
          response.data
        ),

        catchError(error => {
          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to create project.'
          );

          return throwError(
            () => error
          );
        })
      );
  }

  update(
    projectId: string,
    project: UpdateProjectRequest
  ): Observable<Project> {
    this.errorMessage.set('');

    return this.projectService
      .updateProject(
        projectId,
        project
      )
      .pipe(
        tap(response => {
          this.projects.update(
            current =>
              current.map(item =>
                item._id ===
                response.data._id
                  ? response.data
                  : item
              )
          );
        }),

        map(response =>
          response.data
        ),

        catchError(error => {
          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to update project.'
          );

          return throwError(
            () => error
          );
        })
      );
  }

  remove(
    projectId: string
  ): Observable<void> {
    this.errorMessage.set('');

    return this.projectService
      .deleteProject(projectId)
      .pipe(
        tap(() => {
          this.projects.update(
            current =>
              current.filter(
                item =>
                  item._id !==
                  projectId
              )
          );
        }),

        map(() => undefined),

        catchError(error => {
          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to delete project.'
          );

          return throwError(
            () => error
          );
        })
      );
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}