import Task from "../models/task_model.js";

export async function createTask(taskData) {
    const task=await Task.create(taskData);
    return task;
}