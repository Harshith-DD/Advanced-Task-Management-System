import mongoose from "mongoose";

import Project from "../models/project_model.js";
import Task from "../models/task_model.js";

import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../errors/app_error.js";

// ========================================
// DEFAULT PROJECT KEY
// ========================================

function buildDefaultProjectKey(userId) {
  return `GEN-${userId.toString().slice(-8).toUpperCase()}`;
}

// ========================================
// USER / PROJECT REFERENCE HELPERS
// ========================================

function getReferenceId(reference) {
  if (!reference) {
    return null;
  }

  return reference._id?.toString?.() ?? reference.toString();
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isProjectOwner(project, user) {
  return (
    !!project &&
    !!user &&
    getReferenceId(project.owner) === user.userId.toString()
  );
}

export function canAccessProject(project, user) {
  return isAdmin(user) || isProjectOwner(project, user);
}

// ========================================
// ENSURE DEFAULT PROJECT
// ========================================

export async function ensureDefaultProject(userId) {
  const existingProject = await Project.findOne({
    owner: userId,
    name: "General",
  });

  if (existingProject) {
    return existingProject;
  }

  const baseKey = buildDefaultProjectKey(userId);

  for (let suffix = 0; suffix < 10; suffix += 1) {
    const key = suffix === 0 ? baseKey : `${baseKey}-${suffix}`;

    try {
      return await Project.create({
        name: "General",
        key,
        description: "Default project for TaskFlow tasks.",
        owner: userId,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      const projectWithKey = await Project.findOne({ key });

      if (
        projectWithKey?.owner?.toString() === userId.toString()
      ) {
        return projectWithKey;
      }
    }
  }

  throw new Error("Unable to create a unique default project key");
}

// ========================================
// PROJECT RESPONSE SERIALIZATION
// ========================================

async function serializeProject(project) {
  const taskCount = await Task.countDocuments({
    project: project._id,
  });

  return {
    ...project.toObject(),
    taskCount,
  };
}

// ========================================
// GET PROJECTS
// ========================================

export async function getProjects(user) {
  const query = isAdmin(user) ? {} : { owner: user.userId };

  const projects = await Project.find(query)
    .populate("owner", "name email role")
    .sort({ createdAt: 1 });

  return Promise.all(
    projects.map(serializeProject),
  );
}

// ========================================
// GET PROJECT BY ID
// ========================================

export async function getProjectById(projectId, user) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(projectId).populate(
    "owner",
    "name email role",
  );

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!canAccessProject(project, user)) {
    throw new AuthorizationError(
      "You are not authorized to access this project",
    );
  }

  return serializeProject(project);
}

// ========================================
// CREATE PROJECT
// ========================================

export async function createProject(projectData, user) {
  const name = projectData.name?.trim();
  const key = projectData.key?.trim().toUpperCase();
  const description = projectData.description?.trim() ?? "";

  if (!name) {
    throw new ValidationError("Project name is required");
  }

  if (!key) {
    throw new ValidationError("Project key is required");
  }

  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(key)) {
    throw new ValidationError(
      "Project key may contain only letters, numbers, and hyphens",
    );
  }

  try {
    const project = await Project.create({
      name,
      key,
      description,
      owner: user.userId,
    });

    const populatedProject = await Project.findById(
      project._id,
    ).populate("owner", "name email role");

    return serializeProject(populatedProject);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ValidationError("Project key is already in use");
    }

    throw error;
  }
}

// ========================================
// UPDATE PROJECT
// ========================================

export async function updateProject(projectId, projectData, user) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!canAccessProject(project, user)) {
    throw new AuthorizationError(
      "You are not authorized to update this project",
    );
  }

  const updateData = {};

  if (projectData.name !== undefined) {
    const name = projectData.name.trim();

    if (!name) {
      throw new ValidationError("Project name cannot be empty");
    }

    updateData.name = name;
  }

  if (projectData.description !== undefined) {
    updateData.description = projectData.description.trim();
  }

  // Project keys are intentionally immutable because task keys contain the
  // project key prefix (for example WEB-14).
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updateData,
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).populate("owner", "name email role");

  return serializeProject(updatedProject);
}

// ========================================
// DELETE PROJECT
// ========================================

export async function deleteProject(projectId, user) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!canAccessProject(project, user)) {
    throw new AuthorizationError(
      "You are not authorized to delete this project",
    );
  }

  const taskCount = await Task.countDocuments({
    project: projectId,
  });

  if (taskCount > 0) {
    throw new ValidationError(
      "Project cannot be deleted while it contains tasks",
    );
  }

  await Project.deleteOne({ _id: projectId });
}

// ========================================
// RESOLVE PROJECT FOR TASK CREATION
// ========================================

export async function resolveTaskProject(projectId, user) {
  if (!projectId) {
    return ensureDefaultProject(user.userId);
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new NotFoundError("Project not found");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Admins can create tasks in any project. Normal users can create tasks
  // only in projects they own.
  if (!canAccessProject(project, user)) {
    throw new AuthorizationError(
      "You are not authorized to create tasks in this project",
    );
  }

  return project;
}

// ========================================
// RESERVE NEXT TASK KEY
// ========================================

export async function reserveNextTaskKey(projectId) {
  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    { $inc: { taskSequence: 1 } },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return `${project.key}-${project.taskSequence}`;
}
