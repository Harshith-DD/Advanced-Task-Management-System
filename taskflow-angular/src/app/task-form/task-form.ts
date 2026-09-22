import {
Component,
EventEmitter,
Input,
OnChanges,
Output,
SimpleChanges,
inject
} from '@angular/core';

import {
FormBuilder,
ReactiveFormsModule,
Validators
} from '@angular/forms';

import {
Task,
TaskPriority,
TaskStatus,
TaskUser
} from '../task';

import { Project } from '../project';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface TaskFormSubmit {
title: string;
description: string;
status: TaskStatus;
priority: TaskPriority;
dueDate: string | null;
tags: string[];
assignedTo: string | null;
projectId: string;
}

@Component({
selector: 'app-task-form',
imports: [
ReactiveFormsModule,
MatButtonModule,
MatIconModule,
MatFormFieldModule,
MatInputModule,
MatSelectModule
],
templateUrl: './task-form.html',
styleUrl: './task-form.css'
})
export class TaskForm implements OnChanges {
private readonly fb = inject(FormBuilder);

@Input()
users: TaskUser[] = [];

@Input()
projects: Project[] = [];

@Input()
isSaving = false;

@Input()
task: Task | null = null;

@Input()
initialProjectId: string | null = null;

@Input()
canAssign = true;

@Output()
submitted = new EventEmitter<TaskFormSubmit>();

@Output()
cancelled = new EventEmitter<void>();

readonly taskForm = this.fb.nonNullable.group({
title: [
'',
[
Validators.required,
Validators.maxLength(100)
]
],


description: [
  '',
  [
    Validators.required,
    Validators.maxLength(500)
  ]
],

status: [
  'pending' as TaskStatus,
  Validators.required
],

priority: [
  'medium' as TaskPriority,
  Validators.required
],

projectId: [
  '',
  Validators.required
],

assignedTo: [''],

dueDate: [''],

tags: ['']


});

get title() {
return this.taskForm.controls.title;
}

get description() {
return this.taskForm.controls.description;
}

get projectId() {
return this.taskForm.controls.projectId;
}

get isEditing(): boolean {
return !!this.task;
}

ngOnChanges(_changes: SimpleChanges): void {
if (this.task) {
this.taskForm.patchValue({
title: this.task.title,


    description:
      this.task.description,

    status:
      this.task.status,

    priority:
      this.task.priority,

    projectId:
      this.task.project?._id ?? '',

    assignedTo:
      this.task.assignedTo?._id ?? '',

    dueDate:
      this.task.dueDate
        ? this.task.dueDate.slice(0, 10)
        : '',

    tags:
      this.task.tags.join(', ')
  });

  this.taskForm.controls.projectId.disable();
} else {
  this.taskForm.controls.projectId.enable();

  this.reset();
}


}

submit(): void {
if (
this.taskForm.invalid ||
this.isSaving
) {
this.taskForm.markAllAsTouched();
return;
}


const value =
  this.taskForm.getRawValue();

this.submitted.emit({
  title:
    value.title.trim(),

  description:
    value.description.trim(),

  status:
    value.status,

  priority:
    value.priority,

  dueDate:
    value.dueDate || null,

  tags:
    value.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean),

  assignedTo:
    value.assignedTo || null,

  projectId:
    value.projectId
});


}

reset(): void {
const defaultProject =
this.initialProjectId ??
this.projects[0]?._id ??
'';


this.taskForm.reset({
  title: '',

  description: '',

  status: 'pending',

  priority: 'medium',

  projectId:
    defaultProject,

  assignedTo: '',

  dueDate: '',

  tags: ''
});


}
}
