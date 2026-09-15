import { Router } from "express";

import {
    exportTasksController,
    createTaskReportController,
    getReportStatusController,
    downloadReportController
} from "../controllers/report_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";


const router =
    Router();


router.get(
    "/tasks/:format",
    authenticateUser,
    exportTasksController
);

router.post(
    "/tasks/report",
    authenticateUser,
    createTaskReportController
);

router.get(
    "/jobs/:jobId",
    authenticateUser,
    getReportStatusController
);

router.get(
    "/jobs/:jobId/download",
    authenticateUser,
    downloadReportController
);
export default router;