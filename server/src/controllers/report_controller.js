import { createReadStream } from "fs";
import { exportTasks } from "../reports/report_service.js";
import {
    addJob,
    getJobs
} from "../queue/job_queue.js";
import { JOB_TYPES } from "../queue/job_types.js";

// ========================================
// EXPORT TASKS
// ========================================

export async function exportTasksController(req, res) {
    try {
        const format = req.params.format;

        const exportFile = await exportTasks(
            format,
            req.user
        );

        res.setHeader(
            "Content-Type",
            exportFile.contentType
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${exportFile.fileName}"`
        );

        const fileStream =
            createReadStream(exportFile.filePath);

        fileStream.on("error", (error) => {
            console.error(
                "Failed to stream export file:",
                error
            );

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: "Failed to download export"
                });
            } else {
                res.destroy(error);
            }
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error("Failed to export tasks:", error);

        res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to export tasks"
        });
    }
}

export async function createTaskReportController(req, res) {
    try {
        const job = addJob({
            type: JOB_TYPES.REPORT,
            data: {
                user: req.user
            }
        });

        res.status(202).json({
            success: true,
            message: "Task report generation started",
            jobId: job.id
        });
    } catch (error) {
        console.error(
            "Failed to start report generation:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to start report generation"
        });
    }
}

export function getReportStatusController(req, res) {
    const job = getJobs().find(
        (item) =>
            item.id === req.params.jobId &&
            item.type === JOB_TYPES.REPORT
    );

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Report job not found"
        });
    }

    const canAccessJob =
        req.user.role === "admin" ||
        job.data.user.userId === req.user.userId;

    if (!canAccessJob) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to access this report"
        });
    }

    res.status(200).json({
        success: true,
        job: {
            id: job.id,
            status: job.status,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            error: job.error,
            createdAt: job.createdAt
        }
    });
}

export function downloadReportController(req, res) {
    const job = getJobs().find(
        (item) =>
            item.id === req.params.jobId &&
            item.type === JOB_TYPES.REPORT
    );

    if (!job) {
        return res.status(404).json({
            success: false,
            message: "Report job not found"
        });
    }

    const canAccessJob =
        req.user.role === "admin" ||
        job.data.user.userId === req.user.userId;

    if (!canAccessJob) {
        return res.status(403).json({
            success: false,
            message: "You are not allowed to access this report"
        });
    }

    if (job.status !== "completed") {
        return res.status(409).json({
            success: false,
            message: "Report is not ready yet"
        });
    }

    if (!job.result?.filePath) {
        return res.status(404).json({
            success: false,
            message: "Report file not found"
        });
    }

    res.setHeader(
        "Content-Type",
        job.result.contentType
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${job.result.fileName}"`
    );

    const fileStream =
        createReadStream(job.result.filePath);

    fileStream.on("error", (error) => {
        console.error(
            "Failed to stream report file:",
            error
        );

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to download report"
            });
        } else {
            res.destroy(error);
        }
    });

    fileStream.pipe(res);
}