import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  Subject,
  finalize,
  takeUntil
} from 'rxjs';

import {
  Project
} from '../project';

import {
  ProjectService
} from '../services/project';

@Component({
  selector: 'app-projects',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects
  implements OnInit, OnDestroy
{
  private readonly fb =
    inject(FormBuilder);

  private readonly projectService =
    inject(ProjectService);

  private readonly destroy$ =
    new Subject<void>();

  readonly projects =
    signal<Project[]>([]);

  readonly isLoading =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly showCreateForm =
    signal(false);

  readonly projectForm =
    this.fb.nonNullable.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      key: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(
            /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/
          )
        ]
      ],

      description: [
        '',
        Validators.maxLength(500)
      ]
    });

  get name() {
    return this.projectForm.controls.name;
  }

  get key() {
    return this.projectForm.controls.key;
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService
      .getProjects()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() =>
          this.isLoading.set(false)
        )
      )
      .subscribe({
        next: response => {
          this.projects.set(
            response.data
          );
        },

        error: error => {
          console.error(
            'Failed to load projects:',
            error
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to load projects.'
          );
        }
      });
  }

  openCreate(): void {
    this.projectForm.reset({
      name: '',
      key: '',
      description: ''
    });

    this.errorMessage.set('');
    this.showCreateForm.set(true);
  }

  closeCreate(): void {
    if (this.isSaving()) {
      return;
    }

    this.showCreateForm.set(false);
  }

  submit(): void {
    if (
      this.projectForm.invalid ||
      this.isSaving()
    ) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const value =
      this.projectForm.getRawValue();

    this.isSaving.set(true);
    this.errorMessage.set('');

    this.projectService
      .createProject({
        name: value.name.trim(),
        key: value.key
          .trim()
          .toUpperCase(),
        description:
          value.description.trim()
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() =>
          this.isSaving.set(false)
        )
      )
      .subscribe({
        next: response => {
          this.projects.update(
            current => [
              ...current,
              response.data
            ]
          );

          this.showCreateForm.set(false);
        },

        error: error => {
          console.error(
            'Failed to create project:',
            error
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to create project.'
          );
        }
      });
  }

  deleteProject(
    project: Project
  ): void {
    if (
      !window.confirm(
        `Delete project "${project.name}"?`
      )
    ) {
      return;
    }

    this.projectService
      .deleteProject(project._id)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          this.projects.update(
            current =>
              current.filter(
                item =>
                  item._id !==
                  project._id
              )
          );
        },

        error: error => {
          console.error(
            'Failed to delete project:',
            error
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Failed to delete project.'
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}