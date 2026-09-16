import { Router } from "express";

import { getActivitiesController } from "../controllers/activity_controller.js";

import { authenticateUser } from "../middleware/auth_middleware.js";

import { asyncHandler } from "../utils/async_handler.js";

const router = Router();

router.get("/", authenticateUser, asyncHandler(getActivitiesController));

export default router;
