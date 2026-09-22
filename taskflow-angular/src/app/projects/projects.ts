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

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  Project
} from '../project';

import {
  ProjectStateService
} from '../services/project-state';

@Component({
  selector: 'app-projects',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects
  implements OnInit, OnDestroy
{
  private readonly fb =
    inject(FormBuilder);

  protected readonly projectState =
    inject(ProjectStateService);

  private readonly destroy$ =
    new Subject<void>();

  readonly projects =
    this.projectState.projects;

  readonly isLoading =
    this.projectState.isLoading;

  readonly errorMessage =
    this.projectState.errorMessage;

  readonly isSaving =
    signal(false);

  readonly showProjectForm =
    signal(false);

  readonly editingProject =
    signal<Project | null>(null);

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

  get isEditing(): boolean {
    return !!this.editingProject();
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectState
      .load()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to load projects:',
            error
          );
        }
      });
  }

  openCreate(): void {
    this.editingProject.set(null);

    this.projectForm.enable();
    this.projectForm.reset({
      name: '',
      key: '',
      description: ''
    });

    this.projectState.clearError();
    this.showProjectForm.set(true);
  }

  openEdit(project: Project): void {
    this.editingProject.set(project);

    this.projectForm.enable();
    this.projectForm.reset({
      name: project.name,
      key: project.key,
      description: project.description
    });

    // Project keys are part of generated task keys, so they are intentionally
    // immutable after project creation.
    this.projectForm.controls.key.disable();

    this.projectState.clearError();
    this.showProjectForm.set(true);
  }

  closeForm(): void {
    if (this.isSaving()) {
      return;
    }

    this.showProjectForm.set(false);
    this.editingProject.set(null);
    this.projectForm.enable();
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
    this.projectState.clearError();

    const editing =
      this.editingProject();

    const request = editing
      ? this.projectState.update(
          editing._id,
          {
            name: value.name.trim(),
            description:
              value.description.trim()
          }
        )
      : this.projectState.create({
          name: value.name.trim(),
          key: value.key
            .trim()
            .toUpperCase(),
          description:
            value.description.trim()
        });

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() =>
          this.isSaving.set(false)
        )
      )
      .subscribe({
        next: () => {
          this.closeForm();
        },
        error: error => {
          console.error(
            editing
              ? 'Failed to update project:'
              : 'Failed to create project:',
            error
          );
        }
      });
  }

  deleteProject(
    project: Project
  ): void {
    if (
      project.taskCount > 0 ||
      !window.confirm(
        `Delete project "${project.name}"?`
      )
    ) {
      return;
    }

    this.projectState
      .remove(project._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to delete project:',
            error
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
