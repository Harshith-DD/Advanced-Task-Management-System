import Task from "../models/task_model.js";

export async function createTask(taskData) {
    const task=await Task.create(taskData);
    return task;
}
export async function getAllTasks(filters = {}) {
    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.priority) {
        query.priority = filters.priority;
    }

    if (filters.search) {
        query.$or = [
            {
                title: {
                    $regex: filters.search,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: filters.search,
                    $options: "i"
                }
            }
        ];
    }

    const tasks = await Task.find(query);

    return tasks;
}
export async function getTaskById(taskId) {
    const task = await Task.findById(taskId);

    return task;
}
export async function updateTask(taskId, taskData) {
    const task = await Task.findByIdAndUpdate(
        taskId,
        taskData,
        {
            new: true,
            runValidators: true
        }
    );

    return task;
}

export async function deleteTask(taskId) {
    const task = await Task.findByIdAndDelete(taskId);

    return task;
}