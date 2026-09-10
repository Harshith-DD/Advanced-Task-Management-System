import { createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
 } from "../services/task_services.js";

export async function createTaskController(req, res) {
    try {
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            tags: req.body.tags
        };

        const task = await createTask(taskData);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error("Failed to create task:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create task"
        });
    }
}

export async function getAllTasksController(req, res) {
    try {
        const tasks = await getAllTasks(req.query);

        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error("Failed to fetch tasks:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks"
        });
    }
}
export async function getTaskByIdController(req, res) {
    try {
        const task = await getTaskById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error("Failed to fetch task:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch task"
        });
    }
}
export async function updateTaskController(req, res) {
    try {
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
            priority: req.body.priority,
            dueDate: req.body.dueDate,
            tags: req.body.tags
        };

        const task = await updateTask(
            req.params.id,
            taskData
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error("Failed to update task:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update task"
        });
    }
}
export async function deleteTaskController(req, res) {
    try {
        const task = await deleteTask(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Failed to delete task:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete task"
        });
    }
}