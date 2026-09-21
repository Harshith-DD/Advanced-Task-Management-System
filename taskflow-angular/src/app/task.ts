export interface TaskProject {
  _id: string;
  name: string;
  key: string;
  description: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
  };
  taskSequence: number;
}

export type TaskStatus =
  'pending' |
  'in-progress' |
  'completed';

export type TaskPriority =
  'low' |
  'medium' |
  'high';

export interface TaskUser {
  _id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  tags: string[];

  project: TaskProject;

  taskKey: string;

  owner?: TaskUser;
  assignedTo?: TaskUser | null;

  reminderSentAt?: string | null;
  isOverdue: boolean;

  createdAt: string;
  updatedAt: string;
}

export type TaskSortBy =
  'createdAt' |
  'updatedAt' |
  'dueDate' |
  'priority';

export type SortOrder =
  'asc' |
  'desc';

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  projectId?: string;
  search?: string;
  tag?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface TaskPagination {
  page: number;
  limit: number;
  totalTasks: number;
  totalPages: number;
}

export interface TaskListResponse {
  success: boolean;
  data: Task[];
  pagination: TaskPagination;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  projectId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
}

export interface UserListResponse {
  success: boolean;
  data: TaskUser[];
}