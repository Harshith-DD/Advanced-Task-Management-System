export interface ProjectOwner {
  _id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  owner: ProjectOwner;
  taskSequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface ProjectListResponse {
  success: boolean;
  data: Project[];
}