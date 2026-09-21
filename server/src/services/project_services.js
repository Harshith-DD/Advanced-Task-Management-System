import mongoose from "mongoose";

import Project from "../models/project_model.js";

import {
  AuthorizationError,
  NotFoundError,
} from "../errors/app_error.js";

// ========================================
// DEFAULT PROJECT KEY
// ========================================

function buildDefaultProjectKey(userId) {
  return `GEN-${userId.toString().slice(-8).toUpperCase()}`;
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
    const key =
      suffix === 0
        ? baseKey
        : `${baseKey}-${suffix}`;

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

      const projectWithKey = await Project.findOne({
        key,
      });

      if (
        projectWithKey?.owner?.toString() ===
        userId.toString()
      ) {
        return projectWithKey;
      }
    }
  }

  throw new Error(
    "Unable to create a unique default project key",
  );
}

// ========================================
// RESOLVE PROJECT FOR TASK CREATION
// ========================================

export async function resolveTaskProject(
  projectId,
  user,
) {
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

  const isAdmin = user.role === "admin";

  const isOwner =
    project.owner.toString() ===
    user.userId.toString();

  if (!isAdmin && !isOwner) {
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
    {
      _id: projectId,
    },
    {
      $inc: {
        taskSequence: 1,
      },
    },
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