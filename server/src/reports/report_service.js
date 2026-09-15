import {
    mkdir,
    writeFile
} from "fs/promises";

import path from "path";
import { fileURLToPath } from "url";

import Task from "../models/task_model.js";

import {
    buildTaskAccessQuery
} from "../services/task_services.js";


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


const EXPORT_DIRECTORY =
    path.resolve(
        __dirname,
        "../../reports/exports"
    );


// ========================================
// GET ACCESSIBLE TASKS
// ========================================

async function getExportTasks(user) {

    const query =
        buildTaskAccessQuery(user);


    return Task
        .find(query)

        .populate(
            "owner",
            "name email"
        )

        .populate(
            "assignedTo",
            "name email"
        )

        .sort({
            createdAt: 1
        });
}


// ========================================
// CREATE EXPORT DIRECTORY
// ========================================

async function ensureExportDirectory() {

    await mkdir(
        EXPORT_DIRECTORY,
        {
            recursive: true
        }
    );
}


// ========================================
// CREATE FILE NAME
// ========================================

function createFileName(
    prefix,
    format
) {
    const timestamp =
        new Date()
            .toISOString()
            .replace(/[:.]/g, "-");

    return `${prefix}-${timestamp}.${format}`;
}


// ========================================
// CREATE JSON EXPORT
// ========================================

async function createJsonExport(
    tasks
) {

    const fileName =
    createFileName("tasks", "json");


    const filePath =
        path.join(
            EXPORT_DIRECTORY,
            fileName
        );


    const json =
        JSON.stringify(
            tasks,
            null,
            2
        );


    await writeFile(
        filePath,
        json,
        "utf8"
    );


    return {
        filePath,
        fileName,
        contentType:
            "application/json"
    };
}


// ========================================
// CSV VALUE
// ========================================

function escapeCsvValue(
    value
) {

    const stringValue =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    return `"${stringValue.replaceAll(
        '"',
        '""'
    )}"`;
}


// ========================================
// CREATE CSV EXPORT
// ========================================

async function createCsvExport(
    tasks
) {

    const fileName =
    createFileName("tasks", "csv");


    const filePath =
        path.join(
            EXPORT_DIRECTORY,
            fileName
        );


    const headers = [
        "id",
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "tags",
        "owner",
        "assignedTo",
        "isOverdue",
        "createdAt",
        "updatedAt"
    ];


    const rows =
        tasks.map(
            (task) => {

                return [
                    task._id,
                    task.title,
                    task.description,
                    task.status,
                    task.priority,

                    task.dueDate
                        ? task.dueDate.toISOString()
                        : "",

                    Array.isArray(
                        task.tags
                    )
                        ? task.tags.join(", ")
                        : "",

                    task.owner?.name ||
                        "",

                    task.assignedTo?.name ||
                        "",

                    task.isOverdue,

                    task.createdAt
                        ?.toISOString() ||
                        "",

                    task.updatedAt
                        ?.toISOString() ||
                        ""
                ]
                    .map(
                        escapeCsvValue
                    )
                    .join(",");
            }
        );


    const csv = [
        headers
            .map(escapeCsvValue)
            .join(","),

        ...rows

    ].join("\n");


    await writeFile(
        filePath,
        csv,
        "utf8"
    );


    return {
        filePath,
        fileName,
        contentType:
            "text/csv"
    };
}


// ========================================
// EXPORT TASKS
// ========================================

export async function exportTasks(
    format,
    user
) {

    if (
        format !== "json" &&
        format !== "csv"
    ) {
        throw new Error(
            "Unsupported export format"
        );
    }


    await ensureExportDirectory();


    const tasks =
        await getExportTasks(
            user
        );


    if (format === "json") {

        return createJsonExport(
            tasks
        );
    }


    return createCsvExport(
        tasks
    );
}

export async function generateTaskReport(user) {
    await ensureExportDirectory();

    const tasks = await getExportTasks(user);

    const report = {
        generatedAt: new Date().toISOString(),

        summary: {
            totalTasks: tasks.length,

            completedTasks: tasks.filter(
                (task) => task.status === "completed"
            ).length,

            pendingTasks: tasks.filter(
                (task) => task.status === "pending"
            ).length,

            inProgressTasks: tasks.filter(
                (task) => task.status === "in-progress"
            ).length,

            overdueTasks: tasks.filter(
                (task) => task.isOverdue
            ).length
        },

        byPriority: {
            low: tasks.filter(
                (task) => task.priority === "low"
            ).length,

            medium: tasks.filter(
                (task) => task.priority === "medium"
            ).length,

            high: tasks.filter(
                (task) => task.priority === "high"
            ).length
        },

        tasks: tasks.map((task) => ({
            id: task._id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            owner: task.owner
                ? {
                    name: task.owner.name,
                    email: task.owner.email
                }
                : null,
            assignedTo: task.assignedTo
                ? {
                    name: task.assignedTo.name,
                    email: task.assignedTo.email
                }
                : null
        }))
    };

    const fileName =
    createFileName("task-report", "json");
    const filePath = path.join(
        EXPORT_DIRECTORY,
        fileName
    );

    await writeFile(
        filePath,
        JSON.stringify(report, null, 2),
        "utf8"
    );

    return {
        filePath,
        fileName,
        contentType: "application/json"
    };
}