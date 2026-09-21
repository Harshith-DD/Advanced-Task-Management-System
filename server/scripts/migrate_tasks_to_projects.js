import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../src/config/database.js";
import Project from "../src/models/project_model.js";
import Task from "../src/models/task_model.js";

// ========================================
// MIGRATION PURPOSE
// ========================================
//
// Existing TaskFlow tasks were created before
// Projects and task keys existed.
//
// This migration:
//
// 1. Creates one General project per task owner.
// 2. Assigns existing tasks to that project.
// 3. Generates task keys.
// 4. Is safe to run again.
//
// ========================================

async function reserveTaskKey(
  projectId,
) {
  const project =
    await Project.findOneAndUpdate(
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
    throw new Error(
      `Project ${projectId} no longer exists`,
    );
  }

  return `${project.key}-${project.taskSequence}`;
}

async function getOrCreateGeneralProject(
  ownerId,
) {
  const existingProject =
    await Project.findOne({
      owner: ownerId,
      name: "General",
    });

  if (existingProject) {
    return existingProject;
  }

  const baseKey =
    `GEN-${ownerId
      .toString()
      .slice(-8)
      .toUpperCase()}`;

  for (
    let suffix = 0;
    suffix < 10;
    suffix += 1
  ) {
    const key =
      suffix === 0
        ? baseKey
        : `${baseKey}-${suffix}`;

    try {
      return await Project.create({
        name: "General",
        key,
        description:
          "Default project for existing TaskFlow tasks.",
        owner: ownerId,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      const projectWithKey =
        await Project.findOne({
          key,
        });

      if (
        projectWithKey?.owner?.toString() ===
        ownerId.toString()
      ) {
        return projectWithKey;
      }
    }
  }

  throw new Error(
    `Unable to create a unique General project for owner ${ownerId}`,
  );
}

async function migrateTasks() {
  let migratedCount = 0;
  let skippedCount = 0;

  const tasks =
    Task.find({})
      .select(
        "_id owner project taskKey",
      )
      .cursor();

  for await (
    const task of tasks
  ) {
    if (
      task.project &&
      task.taskKey
    ) {
      skippedCount += 1;
      continue;
    }

    if (!task.owner) {
      throw new Error(
        `Task ${task._id} has no owner`,
      );
    }

    const project =
      task.project
        ? await Project.findById(
            task.project,
          )
        : await getOrCreateGeneralProject(
            task.owner,
          );

    if (!project) {
      throw new Error(
        `Project for task ${task._id} was not found`,
      );
    }

    const taskKey =
      task.taskKey ??
      (await reserveTaskKey(
        project._id,
      ));

    await Task.updateOne(
      {
        _id: task._id,
      },
      {
        $set: {
          project: project._id,
          taskKey,
        },
      },
    );

    migratedCount += 1;
  }

  await Task.syncIndexes();

  console.log(
    "Task → Project migration completed",
  );

  console.log(
    `Migrated tasks: ${migratedCount}`,
  );

  console.log(
    `Skipped tasks: ${skippedCount}`,
  );
}

try {
  await connectDatabase();

  await migrateTasks();
} catch (error) {
  console.error(
    "Task → Project migration failed:",
    error,
  );

  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}