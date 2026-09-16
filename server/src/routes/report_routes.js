import { Router } from "express";

import {
  exportTasksController,
  createTaskReportController,
  getReportStatusController,
  downloadReportController,
} from "../controllers/report_controller.js";

import { authenticateUser } from "../middleware/auth_middleware.js";

import { asyncHandler } from "../utils/async_handler.js";

const router = Router();

router.get(
  "/tasks/:format",
  authenticateUser,
  asyncHandler(exportTasksController),
);

router.post(
  "/tasks/report",
  authenticateUser,
  asyncHandler(createTaskReportController),
);

router.get(
  "/jobs/:jobId",
  authenticateUser,
  asyncHandler(getReportStatusController),
);

router.get(
  "/jobs/:jobId/download",
  authenticateUser,
  asyncHandler(downloadReportController),
);
export default router;
