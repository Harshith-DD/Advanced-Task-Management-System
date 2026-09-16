import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import taskRoutes from "./routes/task_routes.js";
import authRoutes from "./routes/auth_routes.js";
import userRoutes from "./routes/user_routes.js";

import activityRoutes from "./routes/activity_routes.js";
import notificationRoutes from "./routes/notification_routes.js";
import dashboardRoutes from "./routes/dashboard_routes.js";
import reportRoutes from "./routes/report_routes.js";

import "./events/task_activity_listener.js";
import "./events/task_notification_listener.js";

import { errorHandler } from "./middleware/error_middleware.js";

import { NotFoundError } from "./errors/app_error.js";

import { validateEnvironment } from "./config/env.js";

validateEnvironment();

const app = express();

// ========================================
// CONFIGURATION
// ========================================

const allowedOrigin = process.env.CORS_ORIGIN;

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.use(cookieParser());

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working fine",
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/activities", activityRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/reports", reportRoutes);

// ========================================
// UNKNOWN ROUTE HANDLER
// ========================================

app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ========================================
// CENTRAL ERROR HANDLER
// ========================================

app.use(errorHandler);

export default app;
