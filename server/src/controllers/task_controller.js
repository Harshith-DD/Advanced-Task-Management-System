import taskService from "../services/task_services.js";

import {
  NotFoundError,
  AuthorizationError,
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
    owner: req.user.userId,
  };

  const task = await taskService.createTask(taskData, req.user.userId);

  res.status(201).json({
    success: true,
    data: task,
  });
}

// ========================================
// GET ALL TASKS
// ========================================

export async function getAllTasksController(req, res) {
  const result = await taskService.getAllTasks(req.query, req.user);

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
  const task = await taskService.getTaskById(req.params.id);
  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // --------------------------------
  // AUTHORIZATION CHECK
  // --------------------------------

  const isAdmin = req.user.role === "admin";

  const isOwner = task.owner && task.owner._id.toString() === req.user.userId;

  const isAssignedUser =
    task.assignedTo &&
    task.assignedTo._id.toString() === req.user.userId.toString();

  if (!isAdmin && !isOwner && !isAssignedUser) {
    throw new AuthorizationError("You are not authorized to access this task");
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
  const task = await taskService.getTaskById(req.params.id);
  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // --------------------------------
  // AUTHORIZATION
  // --------------------------------

  const isAdmin = req.user.role === "admin";

  const isOwner = task.owner && task.owner._id.toString() === req.user.userId;

  const isAssignedUser =
    task.assignedTo && task.assignedTo._id.toString() === req.user.userId;

  if (!isAdmin && !isOwner && !isAssignedUser) {
    throw new AuthorizationError("You are not authorized to update this task");
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
    "tags",
  ];

  const taskData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      taskData[field] = req.body[field];
    }
  }

  if (Object.keys(taskData).length === 0) {
    throw new ValidationError("No valid fields provided for update");
  }

  const updatedTask = await taskService.updateTask(
    req.params.id,
    taskData,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    data: updatedTask,
  });
}

// ========================================
// DELETE TASK
// ========================================

export async function deleteTaskController(req, res) {
  const task = await taskService.getTaskById(req.params.id);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // --------------------------------
  // AUTHORIZATION
  // --------------------------------

  const isAdmin = req.user.role === "admin";

  const isOwner =
    task.owner && task.owner._id.toString() === req.user.userId.toString();

  if (!isAdmin && !isOwner) {
    throw new AuthorizationError("You are not authorized to delete this task");
  }

  await taskService.deleteTask(req.params.id);

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
}

export async function assignTaskController(req, res) {
  const task = await taskService.getTaskById(req.params.id);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  const isOwner =
    task.owner && task.owner._id.toString() === req.user.userId.toString();

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError("You are not authorized to assign this task");
  }

  const { assignedTo } = req.body;

  const updatedTask = await taskService.assignTask(
    req.params.id,
    assignedTo,
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    data: updatedTask,
  });
}
