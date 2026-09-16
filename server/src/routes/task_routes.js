import { Router } from "express";

import {
  createTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  deleteTaskController,
  assignTaskController,
} from "../controllers/task_controller.js";

import { authenticateUser } from "../middleware/auth_middleware.js";
import { asyncHandler } from "../utils/async_handler.js";

const router = Router();

router.post("/", authenticateUser, asyncHandler(createTaskController));

router.get("/", authenticateUser, asyncHandler(getAllTasksController));

router.patch(
  "/:id/assign",
  authenticateUser,
  asyncHandler(assignTaskController),
);

router.get("/:id", authenticateUser, asyncHandler(getTaskByIdController));

router.put("/:id", authenticateUser, asyncHandler(updateTaskController));

router.delete("/:id", authenticateUser, asyncHandler(deleteTaskController));

export default router;
