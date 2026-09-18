export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'completed';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface TaskUser {
  _id: string;
  name: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  owner?: TaskUser;
  assignedTo?: TaskUser;
  reminderSentAt?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskSortBy =
  | 'createdAt'
  | 'updatedAt'
  | 'dueDate'
  | 'priority';

export type SortOrder =
  | 'asc'
  | 'desc';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  tag?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}