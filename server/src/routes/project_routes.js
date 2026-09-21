import { Router } from "express";

import {
  createProjectController,
  deleteProjectController,
  getProjectByIdController,
  getProjectsController,
  updateProjectController,
} from "../controllers/project_controller.js";

import {
  authenticateUser,
} from "../middleware/auth_middleware.js";

import {
  asyncHandler,
} from "../utils/async_handler.js";

const router = Router();

router.get(
  "/",
  authenticateUser,
  asyncHandler(
    getProjectsController,
  ),
);

router.post(
  "/",
  authenticateUser,
  asyncHandler(
    createProjectController,
  ),
);

router.get(
  "/:id",
  authenticateUser,
  asyncHandler(
    getProjectByIdController,
  ),
);

router.put(
  "/:id",
  authenticateUser,
  asyncHandler(
    updateProjectController,
  ),
);

router.delete(
  "/:id",
  authenticateUser,
  asyncHandler(
    deleteProjectController,
  ),
);

export default router;