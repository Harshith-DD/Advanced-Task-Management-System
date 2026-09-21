import { createReadStream } from "fs";

import { exportTasks } from "../reports/report_service.js";

import {
  addReportJob,
  getReportJob,
} from "../queue/queues.js";

import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../errors/app_error.js";

// ========================================
// EXPORT TASKS
// ========================================

export async function exportTasksController(req, res) {
  const format = req.params.format;

  const exportFile = await exportTasks(format, req.user);

  res.setHeader("Content-Type", exportFile.contentType);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${exportFile.fileName}"`,
  );

  const fileStream = createReadStream(exportFile.filePath);

  // Stream errors stay local because
  // they can happen after headers are sent.

  fileStream.on("error", (error) => {
    console.error("Failed to stream export file:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to download export",
      });
    } else {
      res.destroy(error);
    }
  });

  fileStream.pipe(res);
}

// ========================================
// CREATE TASK REPORT
// ========================================

export async function createTaskReportController(req, res) {
  const job = await addReportJob(req.user);

  res.status(202).json({
    success: true,

    message: "Task report generation started",

    jobId: job.id,
  });
}

// ========================================
// GET REPORT STATUS
// ========================================

export async function getReportStatusController(req, res) {
  const job = await getReportJob(req.params.jobId);

  if (!job || job.name !== "generate-task-report") {
    throw new NotFoundError("Report job not found");
  }

  const canAccessJob =
    req.user.role === "admin" || job.data.user.userId === req.user.userId;

  if (!canAccessJob) {
    throw new AuthorizationError("You are not allowed to access this report");
  }

  const state = await job.getState();

  const statusMap = {
    waiting: "pending",
    delayed: "pending",
    prioritized: "pending",
    "waiting-children": "pending",
    active: "processing",
    completed: "completed",
    failed: "failed",
  };

  const status = statusMap[state];

  if (!status) {
    throw new ConflictError(`Unknown report job state: ${state}`);
  }

  res.status(200).json({
    success: true,

    job: {
      id: job.id,
      status,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 3,
      error: status === "failed" ? job.failedReason : null,
      createdAt: new Date(job.timestamp).toISOString(),
    },
  });
}

// ========================================
// DOWNLOAD REPORT
// ========================================

export async function downloadReportController(req, res) {
  const job = await getReportJob(req.params.jobId);

  if (!job || job.name !== "generate-task-report") {
    throw new NotFoundError("Report job not found");
  }

  const canAccessJob =
    req.user.role === "admin" || job.data.user.userId === req.user.userId;

  if (!canAccessJob) {
    throw new AuthorizationError("You are not allowed to access this report");
  }

  const state = await job.getState();

  if (state !== "completed") {
    throw new ConflictError("Report is not ready yet");
  }

  if (!job.returnvalue?.filePath) {
    throw new NotFoundError("Report file not found");
  }

  res.setHeader("Content-Type", job.returnvalue.contentType);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${job.returnvalue.fileName}"`,
  );

  const fileStream = createReadStream(job.returnvalue.filePath);

  // Stream errors stay local for the
  // same reason as the export endpoint.

  fileStream.on("error", (error) => {
    console.error("Failed to stream report file:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to stream report file",
      });
    } else {
      res.destroy(error);
    }
  });

  fileStream.pipe(res);
}