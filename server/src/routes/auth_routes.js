import { Router } from "express";

import {
  registerController,
  loginController,
  getCurrentUserController,
  logoutController,
} from "../controllers/auth_controller.js";

import { authenticateUser } from "../middleware/auth_middleware.js";

import { asyncHandler } from "../utils/async_handler.js";

const router = Router();

router.post("/register", asyncHandler(registerController));

router.post("/login", asyncHandler(loginController));

router.get("/me", authenticateUser, asyncHandler(getCurrentUserController));

router.post("/logout", asyncHandler(logoutController));

export default router;
