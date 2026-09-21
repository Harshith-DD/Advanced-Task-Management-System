import { mkdir } from "fs/promises";

import { createWriteStream } from "fs";

import { finished } from "stream/promises";

import path from "path";

import { fileURLToPath } from "url";

import Task from "../models/task_model.js";

import { buildTaskAccessQuery } from "../services/task_services.js";

import { ValidationError } from "../errors/app_error.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const EXPORT_DIRECTORY = path.resolve(__dirname, "../../reports/exports");

// ========================================
// GET ACCESSIBLE TASKS
// ========================================

async function getExportTasks(user) {
  const query = await buildTaskAccessQuery(user);

  return Task.find(query)

    .populate("project", "name key")

    .populate("owner", "name email")

    .populate("assignedTo", "name email")

    .sort({
      createdAt: 1,
    });
}

// ========================================
// GET ACCESSIBLE TASK CURSOR
// ========================================

async function getExportTaskCursor(user) {
  const query = await buildTaskAccessQuery(user);

  return Task.find(query)

    .populate("project", "name key")

    .populate("owner", "name email")

    .populate("assignedTo", "name email")

    .sort({
      createdAt: 1,
    })

    .cursor();
}

// ========================================
// CREATE EXPORT DIRECTORY
// ========================================

async function ensureExportDirectory() {
  await mkdir(EXPORT_DIRECTORY, {
    recursive: true,
  });
}

// ========================================
// CREATE FILE NAME
// ========================================

function createFileName(prefix, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `${prefix}-${timestamp}.${format}`;
}

// ========================================
// WRITE STREAM CHUNK
// ========================================

function writeChunk(stream, chunk) {
  return new Promise((resolve, reject) => {
    const canContinue = stream.write(chunk);

    if (canContinue) {
      resolve();
      return;
    }

    stream.once("drain", resolve);

    stream.once("error", reject);
  });
}

// ========================================
// CREATE JSON EXPORT
// ========================================

async function createJsonExport(user) {
  const fileName = createFileName("tasks", "json");

  const filePath = path.join(EXPORT_DIRECTORY, fileName);

  const stream = createWriteStream(filePath, {
    encoding: "utf8",
  });

  try {
    await writeChunk(stream, "[\n");

    let isFirstTask = true;

    for await (const task of await getExportTaskCursor(user)) {
      if (!isFirstTask) {
        await writeChunk(stream, ",\n");
      }

      await writeChunk(stream, JSON.stringify(task, null, 2));

      isFirstTask = false;
    }

    await writeChunk(stream, "\n]");

    stream.end();

    await finished(stream);

    return {
      filePath,
      fileName,
      contentType: "application/json",
    };
  } catch (error) {
    stream.destroy();

    throw error;
  }
}

// ========================================
// CSV VALUE
// ========================================

function escapeCsvValue(value) {
  const stringValue =
    value === null || value === undefined ? "" : String(value);

  return `"${stringValue.replaceAll('"', '""')}"`;
}

// ========================================
// CREATE CSV EXPORT
// ========================================

async function createCsvExport(user) {
  const fileName = createFileName("tasks", "csv");

  const filePath = path.join(EXPORT_DIRECTORY, fileName);

  const stream = createWriteStream(filePath, {
    encoding: "utf8",
  });

  const headers = [
    "id",
    "taskKey",
    "projectKey",
    "projectName",
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "tags",
    "owner",
    "assignedTo",
    "isOverdue",
    "createdAt",
    "updatedAt",
  ];

  try {
    await writeChunk(stream, headers.map(escapeCsvValue).join(",") + "\n");

    for await (const task of await getExportTaskCursor(user)) {
      const row = [
        task._id,
        task.taskKey,
        task.project?.key || "",
        task.project?.name || "",
        task.title,
        task.description,
        task.status,
        task.priority,

        task.dueDate ? task.dueDate.toISOString() : "",

        Array.isArray(task.tags) ? task.tags.join(", ") : "",

        task.owner?.name || "",

        task.assignedTo?.name || "",

        task.isOverdue,

        task.createdAt?.toISOString() || "",

        task.updatedAt?.toISOString() || "",
      ]
        .map(escapeCsvValue)
        .join(",");

      await writeChunk(stream, `${row}\n`);
    }

    stream.end();

    await finished(stream);

    return {
      filePath,
      fileName,
      contentType: "text/csv",
    };
  } catch (error) {
    stream.destroy();

    throw error;
  }
}

// ========================================
// EXPORT TASKS
// ========================================

export async function exportTasks(format, user) {
  if (format !== "json" && format !== "csv") {
    throw new ValidationError("Unsupported export format");
  }

  await ensureExportDirectory();

  if (format === "json") {
    return createJsonExport(user);
  }

  return createCsvExport(user);
}

// ========================================
// GENERATE BACKGROUND TASK REPORT
// ========================================

export async function generateTaskReport(user) {
  await ensureExportDirectory();

  const tasks = await getExportTasks(user);

  const report = {
    generatedAt: new Date().toISOString(),

    summary: {
      totalTasks: tasks.length,

      completedTasks: tasks.filter((task) => task.status === "completed")
        .length,

      pendingTasks: tasks.filter((task) => task.status === "pending").length,

      inProgressTasks: tasks.filter((task) => task.status === "in-progress")
        .length,

      overdueTasks: tasks.filter((task) => task.isOverdue).length,
    },

    byPriority: {
      low: tasks.filter((task) => task.priority === "low").length,

      medium: tasks.filter((task) => task.priority === "medium").length,

      high: tasks.filter((task) => task.priority === "high").length,
    },

    tasks: tasks.map((task) => ({
      id: task._id,

      taskKey: task.taskKey,

      project: task.project
        ? {
            name: task.project.name,
            key: task.project.key,
          }
        : null,

      title: task.title,

      status: task.status,

      priority: task.priority,

      dueDate: task.dueDate,

      owner: task.owner
        ? {
            name: task.owner.name,

            email: task.owner.email,
          }
        : null,

      assignedTo: task.assignedTo
        ? {
            name: task.assignedTo.name,

            email: task.assignedTo.email,
          }
        : null,
    })),
  };

  const fileName = createFileName("task-report", "json");

  const filePath = path.join(EXPORT_DIRECTORY, fileName);

  const reportJson = JSON.stringify(report, null, 2);

  const stream = createWriteStream(filePath, {
    encoding: "utf8",
  });

  try {
    await writeChunk(stream, reportJson);

    stream.end();

    await finished(stream);

    return {
      filePath,
      fileName,
      contentType: "application/json",
    };
  } catch (error) {
    stream.destroy();

    throw error;
  }
}
