import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";

import taskRoutes from "./routes/task_routes.js";
import authRoutes from "./routes/auth_routes.js";
import userRoutes from "./routes/user_routes.js";

import "./events/task_activity_listener.js";
import "./events/task_notification_listener.js";

import activityRoutes from "./routes/activity_routes.js";
import notificationRoutes
    from "./routes/notification_routes.js";
import dashboardRoutes
    from "./routes/dashboard_routes.js";
import reportRoutes
    from "./routes/report_routes.js";

import {
    startReminderScheduler
} from "./services/reminder_scheduler.js";

import {
    connectDatabase
} from "./config/database.js";

import {
    startQueueWorker
} from "./workers/queue_worker.js";

const app = express();

const PORT = process.env.PORT;
const allowedOrigin =
    process.env.CORS_ORIGIN;
const httpsOptions = {
    key: fs.readFileSync("./certs/localhost+2-key.pem"),
    cert: fs.readFileSync("./certs/localhost+2.pem")
};

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

app.get(
    "/api/health",
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "API is working fine"
        });
    }
);

app.use(
    "/api/auth",
    authRoutes
);
app.use(
    "/api/users",
    userRoutes
);
app.use(
    "/api/tasks",
    taskRoutes
);
app.use(
    "/api/activities",
    activityRoutes
);
app.use(
    "/api/notifications",
    notificationRoutes
);
app.use(
    "/api/dashboard",
    dashboardRoutes
);
app.use(
    "/api/reports",
    reportRoutes
);

async function startServer() {
    try {
        await connectDatabase();

        startReminderScheduler();
        startQueueWorker();

        https.createServer(
            httpsOptions,
            app
        ).listen(
            PORT,
            () => {
                console.log(
                    `HTTPS server is running on https://127.0.0.1:${PORT}`
                );
            }
        );

    } catch (error) {
        console.error(
            "Failed to start server",
            error
        );

        process.exit(1);
    }
}

startServer();