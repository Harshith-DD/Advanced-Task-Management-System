import taskService from "../services/task_services.js";

import {
  NotFoundError,
  ValidationError,
} from "../errors/app_error.js";

// ========================================
// CREATE TASK
// ========================================

export async function createTaskController(req, res) {
  const taskData = {
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
    tags: req.body.tags,
    projectId: req.body.projectId,
  };

  const task = await taskService.createTask(
    taskData,
    req.user,
  );

  res.status(201).json({
    success: true,
    data: task,
  });
}

// ========================================
// GET ALL TASKS
// ========================================

export async function getAllTasksController(req, res) {
  const result = await taskService.getAllTasks(
    req.query,
    req.user,
  );

  res.status(200).json({
    success: true,
    data: result.tasks,
    pagination: result.pagination,
  });
}

// ========================================
// GET ONE TASK
// ========================================

export async function getTaskByIdController(req, res) {
  const task = await taskService.getTaskById(
    req.params.id,
    req.user,
  );

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  res.status(200).json({
    success: true,
    data: task,
  });
}

// ========================================
// UPDATE TASK
// ========================================

export async function updateTaskController(req, res) {
  const allowedFields = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "tags",
  ];

  const taskData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      taskData[field] = req.body[field];
    }
  }

  if (Object.keys(taskData).length === 0) {
    throw new ValidationError(
      "No valid fields provided for update",
    );
  }

  const updatedTask = await taskService.updateTask(
    req.params.id,
    taskData,
    req.user,
  );

  if (!updatedTask) {
    throw new NotFoundError("Task not found");
  }

  res.status(200).json({
    success: true,
    data: updatedTask,
  });
}

// ========================================
// DELETE TASK
// ========================================

export async function deleteTaskController(req, res) {
  const deletedTask = await taskService.deleteTask(
    req.params.id,
    req.user,
  );

  if (!deletedTask) {
    throw new NotFoundError("Task not found");
  }

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
}

// ========================================
// ASSIGN TASK
// ========================================

export async function assignTaskController(req, res) {
  const { assignedTo } = req.body;

  const updatedTask = await taskService.assignTask(
    req.params.id,
    assignedTo,
    req.user,
  );

  if (!updatedTask) {
    throw new NotFoundError("Task not found");
  }

  res.status(200).json({
    success: true,
    data: updatedTask,
  });
}
