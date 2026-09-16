import { createReadStream } from "fs";

import { exportTasks } from "../reports/report_service.js";

import { addJob, getJobById } from "../queue/job_queue.js";

import { JOB_TYPES } from "../queue/job_types.js";

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
  const job = await addJob({
    type: JOB_TYPES.REPORT,

    data: {
      user: req.user,
    },
  });

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
  const job = await getJobById(req.params.jobId);

  if (!job || job.type !== JOB_TYPES.REPORT) {
    throw new NotFoundError("Report job not found");
  }

  const canAccessJob =
    req.user.role === "admin" || job.data.user.userId === req.user.userId;

  if (!canAccessJob) {
    throw new AuthorizationError("You are not allowed to access this report");
  }

  res.status(200).json({
    success: true,

    job: {
      id: job.id,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      error: job.error,
      createdAt: job.createdAt,
    },
  });
}

// ========================================
// DOWNLOAD REPORT
// ========================================

export async function downloadReportController(req, res) {
  const job = await getJobById(req.params.jobId);

  if (!job || job.type !== JOB_TYPES.REPORT) {
    throw new NotFoundError("Report job not found");
  }

  const canAccessJob =
    req.user.role === "admin" || job.data.user.userId === req.user.userId;

  if (!canAccessJob) {
    throw new AuthorizationError("You are not allowed to access this report");
  }

  if (job.status !== "completed") {
    throw new ConflictError("Report is not ready yet");
  }

  if (!job.result?.filePath) {
    throw new NotFoundError("Report file not found");
  }

  res.setHeader("Content-Type", job.result.contentType);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${job.result.fileName}"`,
  );

  const fileStream = createReadStream(job.result.filePath);

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
