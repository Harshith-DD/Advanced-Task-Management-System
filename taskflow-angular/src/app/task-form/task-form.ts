import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Task, TaskPriority, TaskStatus, TaskUser
} from '../task';

export interface TaskFormSubmit {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  assignedTo: string | null;
}

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css'
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);

  @Input() users: TaskUser[] = [];
  @Input() isSaving = false;
  @Input() task: Task | null = null;

  @Output() submitted = new EventEmitter<TaskFormSubmit>();
  @Output() cancelled = new EventEmitter<void>();

  readonly taskForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    status: ['pending' as TaskStatus, Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    assignedTo: [''],
    dueDate: [''],
    tags: ['']
  });

  get title() { return this.taskForm.controls.title; }
  get description() { return this.taskForm.controls.description; }
  get isEditing() { return !!this.task; }

  ngOnChanges(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        priority: this.task.priority,
        assignedTo: this.task.assignedTo?._id ?? '',
        dueDate: this.task.dueDate
          ? this.task.dueDate.slice(0, 10)
          : '',
        tags: this.task.tags.join(', ')
      });
    } else {
      this.reset();
    }
  }

  submit(): void {
    if (this.taskForm.invalid || this.isSaving) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.getRawValue();
    this.submitted.emit({
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate || null,
      tags: value.tags.split(',').map(v => v.trim()).filter(Boolean),
      assignedTo: value.assignedTo || null
    });
  }

  reset(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      assignedTo: '',
      dueDate: '',
      tags: ''
    });
  }
}
