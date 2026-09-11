import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask
} from "../services/task_services.js";


// ========================================
// CREATE TASK
// ========================================

export async function createTaskController(
    req,
    res
) {
    try {
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            tags: req.body.tags,

            // IMPORTANT:
            // Owner comes from authenticated user.
            owner: req.user.userId
        };


        const task =
    await createTask(
        taskData,
        req.user.userId
    );


        res.status(201).json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error(
            "Failed to create task:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to create task"
        });
    }
}


// ========================================
// GET ALL TASKS
// ========================================

export async function getAllTasksController(
    req,
    res
) {
    try {
        const result =
            await getAllTasks(
                req.query,
                req.user
            );


        res.status(200).json({
            success: true,
            data: result.tasks,
            pagination:
                result.pagination
        });

    } catch (error) {
        console.error(
            "Failed to fetch tasks:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch tasks"
        });
    }
}


// ========================================
// GET ONE TASK
// ========================================

export async function getTaskByIdController(
    req,
    res
) {
    try {
        const task =
            await getTaskById(
                req.params.id
            );


        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }


        // --------------------------------
        // AUTHORIZATION CHECK
        // --------------------------------

        const isAdmin =
            req.user.role === "admin";


        const isOwner =
            task.owner &&
            task.owner._id.toString() ===
                req.user.userId;


        const isAssignedUser =
    task.assignedTo &&
    task.assignedTo._id.toString() ===
        req.user.userId.toString();


        if (
            !isAdmin &&
            !isOwner &&
            !isAssignedUser
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to view this task"
            });
        }


        res.status(200).json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error(
            "Failed to fetch task:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch task"
        });
    }
}


// ========================================
// UPDATE TASK
// ========================================

export async function updateTaskController(
    req,
    res
) {
    try {
        const task =
            await getTaskById(
                req.params.id
            );


        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }


        // --------------------------------
        // AUTHORIZATION
        // --------------------------------

        const isAdmin =
            req.user.role === "admin";


        const isOwner =
            task.owner &&
            task.owner._id.toString() ===
                req.user.userId;


        const isAssignedUser =
            task.assignedTo &&
            task.assignedTo._id.toString() ===
                req.user.userId;


        if (
            !isAdmin &&
            !isOwner &&
            !isAssignedUser
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to update this task"
            });
        }


        // --------------------------------
        // ALLOWED TASK FIELDS
        // --------------------------------

        const allowedFields = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "tags"
];

const taskData = {};

for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
        taskData[field] = req.body[field];
    }
}

if (Object.keys(taskData).length === 0) {
    return res.status(400).json({
        success: false,
        message:
            "No valid fields provided for update"
    });
}


        const updatedTask =
    await updateTask(
        req.params.id,
        taskData,
        req.user.userId
    );


        res.status(200).json({
            success: true,
            data: updatedTask
        });

    } catch (error) {
        console.error(
            "Failed to update task:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to update task"
        });
    }
}


// ========================================
// DELETE TASK
// ========================================

export async function deleteTaskController(
    req,
    res
) {
    try {
        const task =
            await getTaskById(
                req.params.id
            );


        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }


        // --------------------------------
        // AUTHORIZATION
        // --------------------------------

        const isAdmin =
            req.user.role === "admin";


        const isOwner =
    task.owner &&
    task.owner._id.toString() ===
        req.user.userId.toString();


        if (
            !isAdmin &&
            !isOwner
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to delete this task"
            });
        }


        await deleteTask(
            req.params.id
        );


        res.status(200).json({
            success: true,
            message:
                "Task deleted successfully"
        });

    } catch (error) {
        console.error(
            "Failed to delete task:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete task"
        });
    }
}

export async function assignTaskController(
    req,
    res
) {
    try {
        const task =
            await getTaskById(
                req.params.id
            );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        const isOwner =
            task.owner &&
            task.owner._id.toString() ===
                req.user.userId.toString();

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to assign this task"
            });
        }

        const { assignedTo } = req.body;

        const updatedTask =
    await assignTask(
        req.params.id,
        assignedTo,
        req.user.userId
    );

        res.status(200).json({
            success: true,
            data: updatedTask
        });

    } catch (error) {
        console.error(
            "Failed to assign task:",
            error
        );

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}