export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  owner?: string;
  assignedTo?: string;
  reminderSentAt?: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}