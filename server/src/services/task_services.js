import Task from "../models/task_model.js";

export async function createTask(taskData) {
    const task=await Task.create(taskData);
    return task;
}
export async function getAllTasks() {
    const tasks = await Task.find();

    return tasks;
}
export async function getTaskById(taskId) {
    const task = await Task.findById(taskId);

    return task;
}
