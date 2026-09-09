import { createTask } from "../services/task_services.js";

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