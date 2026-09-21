import Task from "../models/task_model.js";
import User from "../models/user_model.js";
import Project from "../models/project_model.js";
import mongoose from "mongoose";

import {
  isAdmin,
  isProjectOwner,
  resolveTaskProject,
  reserveNextTaskKey,
} from "./project_services.js";

import taskEvents, {
  TASK_EVENTS,
} from "../events/task_events.js";

import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../errors/app_error.js";

// ========================================
// BUILD TASK ACCESS QUERY
// ========================================

export async function buildTaskAccessQuery(user) {
  if (isAdmin(user)) {
    return {};
  }

  // A normal user can access tasks they own, tasks assigned to them,
  // and every task inside a project they own. The project-owner rule is
  // important because an admin may create a task inside another user's
  // project; the project owner must still be able to see/manage that task.
  const ownedProjectIds = await Project.distinct("_id", {
    owner: user.userId,
  });

  return {
    $or: [
      { owner: user.userId },
      { assignedTo: user.userId },
      { project: { $in: ownedProjectIds } },
    ],
  };
}

function canAccessTask(task, user) {
  if (isAdmin(user)) {
    return true;
  }

  const userId = user.userId.toString();
  const ownerId = task.owner?._id?.toString?.() ?? task.owner?.toString?.();
  const assignedId =
    task.assignedTo?._id?.toString?.() ??
    task.assignedTo?.toString?.();

  return (
    ownerId === userId ||
    assignedId === userId ||
    isProjectOwner(task.project, user)
  );
}

function canModifyTask(task, user) {
  if (isAdmin(user)) {
    return true;
  }

  const userId = user.userId.toString();
  const ownerId =
    task.owner?._id?.toString?.() ??
    task.owner?.toString?.();
  const assignedId =
    task.assignedTo?._id?.toString?.() ??
    task.assignedTo?.toString?.();

  return (
    ownerId === userId ||
    assignedId === userId ||
    isProjectOwner(task.project, user)
  );
}

function canDeleteTask(task, user) {
  if (isAdmin(user)) {
    return true;
  }

  const ownerId =
    task.owner?._id?.toString?.() ??
    task.owner?.toString?.();

  return (
    ownerId === user.userId.toString() ||
    isProjectOwner(task.project, user)
  );
}

function canAssignTask(task, user) {
  if (isAdmin(user)) {
    return true;
  }

  const ownerId =
    task.owner?._id?.toString?.() ??
    task.owner?.toString?.();

  return (
    ownerId === user.userId.toString() ||
    isProjectOwner(task.project, user)
  );
}

function parseDateFilter(
  value,
  fieldName,
  endOfDay = false,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(
      `${fieldName} must be a valid date`,
    );
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function calculateIsOverdue(
  dueDate,
  status,
) {
  if (!dueDate || status === "completed") {
    return false;
  }

  const parsedDueDate = new Date(dueDate);

  if (Number.isNaN(parsedDueDate.getTime())) {
    return false;
  }

  return parsedDueDate < new Date();
}

function arraysEqual(first, second) {
  if (!Array.isArray(first) || !Array.isArray(second)) {
    return false;
  }

  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

// ========================================
// TASK SERVICE
// ========================================

class TaskService {
  // ====================================
  // CREATE TASK
  // ====================================

  async createTask(taskData, user) {
    const status =
      taskData.status ?? "pending";

    const project =
      await resolveTaskProject(
        taskData.projectId,
        user,
      );

    const taskKey =
      await reserveNextTaskKey(
        project._id,
      );

    const task = await Task.create({
      title: taskData.title,
      description: taskData.description,
      status,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      project: project._id,
      taskKey,
      owner: user.userId,
      isOverdue: calculateIsOverdue(
        taskData.dueDate,
        status,
      ),
    });

    const populatedTask =
      await Task.findById(task._id)
        .populate({
        path: "project",
        select: "name key description owner taskSequence",
        populate: {
          path: "owner",
          select: "name email role",
        },
      })
        .populate(
          "owner",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role",
        );

    taskEvents.emit(
      TASK_EVENTS.CREATED,
      {
        task: populatedTask,
        userId: user.userId,
      },
    );

    if (status === "completed") {
      taskEvents.emit(
        TASK_EVENTS.COMPLETED,
        {
          task: populatedTask,
          userId: user.userId,
        },
      );
    }

    return populatedTask;
  }

  // ====================================
  // GET ALL TASKS
  // ====================================

  async getAllTasks(
    filters = {},
    user,
  ) {
    const {
      status,
      priority,
      search,
      tag,
      projectId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      sortOrder = "asc",
      page = 1,
      limit = 10,
    } = filters;

    // --------------------------------
    // BUILD QUERY CONDITIONS
    // --------------------------------

    const conditions = [];

    // --------------------------------
    // AUTHORIZATION FILTER
    // --------------------------------

    const accessQuery =
      await buildTaskAccessQuery(user);

    if (
      Object.keys(accessQuery).length > 0
    ) {
      conditions.push(accessQuery);
    }

    // --------------------------------
    // PROJECT FILTER
    // --------------------------------

    if (projectId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          projectId,
        )
      ) {
        throw new ValidationError(
          "projectId must be a valid project ID",
        );
      }

      conditions.push({
        project: projectId,
      });
    }

    // --------------------------------
    // STATUS FILTER
    // --------------------------------

    if (status) {
      conditions.push({
        status,
      });
    }

    // --------------------------------
    // PRIORITY FILTER
    // --------------------------------

    if (priority) {
      conditions.push({
        priority,
      });
    }

    // --------------------------------
    // SEARCH FILTER
    // --------------------------------

    const escapedSearch = search
      ? escapeRegex(search)
      : null;

    if (escapedSearch) {
      conditions.push({
        $or: [
          {
            title: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
          {
            description: {
              $regex: escapedSearch,
              $options: "i",
            },
          },
        ],
      });
    }

    // --------------------------------
    // TAG FILTER
    // --------------------------------

    if (tag) {
      conditions.push({
        tags: {
          $in: [tag],
        },
      });
    }

    // --------------------------------
    // DATE FILTER
    // --------------------------------

    if (fromDate || toDate) {
      const dueDateQuery = {};

      const normalizedFromDate =
        fromDate
          ? parseDateFilter(
              fromDate,
              "fromDate",
            )
          : null;

      const normalizedToDate =
        toDate
          ? parseDateFilter(
              toDate,
              "toDate",
              true,
            )
          : null;

      if (
        normalizedFromDate &&
        normalizedToDate &&
        normalizedFromDate >
          normalizedToDate
      ) {
        throw new ValidationError(
          "fromDate cannot be later than toDate",
        );
      }

      if (normalizedFromDate) {
        dueDateQuery.$gte =
          normalizedFromDate;
      }

      if (normalizedToDate) {
        dueDateQuery.$lte =
          normalizedToDate;
      }

      conditions.push({
        dueDate: dueDateQuery,
      });
    }

    // --------------------------------
    // FINAL QUERY
    // --------------------------------

    const query =
      conditions.length > 0
        ? { $and: conditions }
        : {};

    // --------------------------------
    // SORTING
    // --------------------------------

    const allowedSortFields = [
      "dueDate",
      "priority",
      "createdAt",
      "updatedAt",
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

    const safeSortOrder =
      sortOrder === "desc" ? -1 : 1;

    // --------------------------------
    // PAGINATION
    // --------------------------------

    const pageNumber = Math.max(
      Number(page) || 1,
      1,
    );

    const pageLimit = Math.min(
      Math.max(
        Number(limit) || 10,
        1,
      ),
      100,
    );

    const skip =
      (pageNumber - 1) * pageLimit;

    // --------------------------------
    // DATABASE QUERIES
    // --------------------------------

    const [
      totalTasks,
      tasks,
    ] = await Promise.all([
      Task.countDocuments(query),

      safeSortBy === "priority"
        ? Task.aggregate([
            {
              $match: query,
            },

            {
              $addFields: {
                priorityOrder: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$priority",
                            "low",
                          ],
                        },
                        then: 1,
                      },
                      {
                        case: {
                          $eq: [
                            "$priority",
                            "medium",
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            "$priority",
                            "high",
                          ],
                        },
                        then: 3,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },

            {
              $sort: {
                priorityOrder:
                  safeSortOrder,
              },
            },

            {
              $skip: skip,
            },

            {
              $limit: pageLimit,
            },

            {
              $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
              },
            },

            {
              $unwind: {
                path: "$project",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "users",
                localField: "project.owner",
                foreignField: "_id",
                as: "projectOwner",
              },
            },

            {
              $unwind: {
                path: "$projectOwner",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $set: {
                "project.owner": {
                  _id: "$projectOwner._id",
                  name: "$projectOwner.name",
                  email: "$projectOwner.email",
                  role: "$projectOwner.role",
                },
              },
            },

            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
              },
            },

            {
              $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
              },
            },

            {
              $unwind: {
                path: "$assignedTo",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                status: 1,
                priority: 1,
                dueDate: 1,
                tags: 1,
                reminderSentAt: 1,
                isOverdue: 1,
                project: {
                  _id: 1,
                  name: 1,
                  key: 1,
                  description: 1,
                  taskSequence: 1,
                  owner: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                  },
                },
                taskKey: 1,
                owner: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  role: 1,
                },
                assignedTo: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  role: 1,
                },
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ])
        : Task.find(query)
            .populate({
              path: "project",
              select: "name key description owner taskSequence",
              populate: {
                path: "owner",
                select: "name email role",
              },
            })
            .populate(
              "owner",
              "name email role",
            )
            .populate(
              "assignedTo",
              "name email role",
            )
            .sort({
              [safeSortBy]:
                safeSortOrder,
            })
            .skip(skip)
            .limit(pageLimit),
    ]);

    // --------------------------------
    // PAGINATION METADATA
    // --------------------------------

    const totalPages = Math.ceil(
      totalTasks / pageLimit,
    );

    return {
      tasks,

      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalTasks,
        totalPages,
      },
    };
  }

  // ====================================
  // GET ONE TASK
  // ====================================

  async getTaskById(taskId, user) {
    const task = await Task.findById(taskId)
      .populate({
        path: "project",
        select: "name key description owner taskSequence",
        populate: {
          path: "owner",
          select: "name email role",
        },
      })
      .populate(
        "owner",
        "name email role",
      )
      .populate(
        "assignedTo",
        "name email role",
      );

    if (!task) {
      return null;
    }

    if (user && !canAccessTask(task, user)) {
      throw new AuthorizationError(
        "You are not authorized to access this task",
      );
    }

    return task;
  }

  // ====================================
  // UPDATE TASK
  // ====================================

  async updateTask(
    taskId,
    taskData,
    user,
  ) {
    const existingTask =
      await Task.findById(taskId)
        .populate({
        path: "project",
        select: "name key description owner taskSequence",
        populate: {
          path: "owner",
          select: "name email role",
        },
      })
        .populate(
          "owner",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role",
        );

    if (!existingTask) {
      return null;
    }

    if (!canModifyTask(existingTask, user)) {
      throw new AuthorizationError(
        "You are not authorized to update this task",
      );
    }

    const userId = user.userId;

    const updateData = {
      ...taskData,
    };

    const existingDueDate =
      existingTask.dueDate
        ? new Date(
            existingTask.dueDate,
          ).getTime()
        : null;

    const newDueDate =
      taskData.dueDate !== undefined &&
      taskData.dueDate !== null &&
      taskData.dueDate !== ""
        ? new Date(
            taskData.dueDate,
          ).getTime()
        : null;

    const dueDateChanged =
      taskData.dueDate !== undefined &&
      existingDueDate !== newDueDate;

    const effectiveStatus =
      taskData.status ??
      existingTask.status;

    const effectiveDueDate =
      taskData.dueDate !== undefined
        ? taskData.dueDate
        : existingTask.dueDate;

    if (dueDateChanged) {
      updateData.reminderSentAt =
        null;
    }

    updateData.isOverdue =
      calculateIsOverdue(
        effectiveDueDate,
        effectiveStatus,
      );

    const updatedTask =
      await Task.findByIdAndUpdate(
        taskId,
        updateData,
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
        .populate({
        path: "project",
        select: "name key description owner taskSequence",
        populate: {
          path: "owner",
          select: "name email role",
        },
      })
        .populate(
          "owner",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role",
        );

    const changes = [];

    if (
      taskData.title !== undefined &&
      existingTask.title !== updatedTask.title
    ) {
      changes.push("title changed");
    }

    if (
      taskData.description !== undefined &&
      existingTask.description !== updatedTask.description
    ) {
      changes.push("description changed");
    }

    if (
      taskData.status !== undefined &&
      existingTask.status !== updatedTask.status
    ) {
      changes.push(
        `status changed from ${existingTask.status} to ${updatedTask.status}`,
      );
    }

    if (
      taskData.priority !== undefined &&
      existingTask.priority !== updatedTask.priority
    ) {
      changes.push(
        `priority changed from ${existingTask.priority} to ${updatedTask.priority}`,
      );
    }

    if (dueDateChanged) {
      changes.push("due date changed");
    }

    if (
      taskData.tags !== undefined &&
      !arraysEqual(existingTask.tags, updatedTask.tags)
    ) {
      changes.push("tags changed");
    }

    if (changes.length > 0) {
      taskEvents.emit(
        TASK_EVENTS.UPDATED,
        {
          task: updatedTask,
          userId,
          changes,
        },
      );
    }

    const priorityChanged =
      existingTask.priority !==
      updatedTask.priority;

    if (priorityChanged) {
      taskEvents.emit(
        TASK_EVENTS.PRIORITY_CHANGED,
        {
          task: updatedTask,
          userId,
          previousPriority:
            existingTask.priority,
          newPriority:
            updatedTask.priority,
        },
      );
    }

    const wasCompleted =
      existingTask.status ===
      "completed";

    const isCompleted =
      updatedTask.status ===
      "completed";

    if (
      !wasCompleted &&
      isCompleted
    ) {
      taskEvents.emit(
        TASK_EVENTS.COMPLETED,
        {
          task: updatedTask,
          userId,
        },
      );
    }

    return updatedTask;
  }

  // ====================================
  // DELETE TASK
  // ====================================

  async deleteTask(taskId, user) {
    const task = await Task.findById(taskId)
      .populate({
        path: "project",
        select: "name key description owner taskSequence",
        populate: {
          path: "owner",
          select: "name email role",
        },
      })
      .populate(
        "owner",
        "name email role",
      )
      .populate(
        "assignedTo",
        "name email role",
      );

    if (!task) {
      return null;
    }

    if (!canDeleteTask(task, user)) {
      throw new AuthorizationError(
        "You are not authorized to delete this task",
      );
    }

    await Task.deleteOne({ _id: taskId });

    return task;
  }

  // ====================================
  // ASSIGN TASK
  // ====================================

  async assignTask(
    taskId,
    assignedTo,
    user,
  ) {
    const task =
      await Task.findById(taskId)
        .populate({
          path: "project",
          select: "name key description owner taskSequence",
          populate: {
            path: "owner",
            select: "name email role",
          },
        })
        .populate(
          "owner",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role",
        );

    if (!task) {
      return null;
    }

    if (!canAssignTask(task, user)) {
      throw new AuthorizationError(
        "You are not authorized to assign this task",
      );
    }

    const userId = user.userId;

    const previousAssigneeId =
      task.assignedTo?._id?.toString?.() ??
      task.assignedTo?.toString?.() ??
      null;

    const nextAssigneeId = assignedTo
      ? assignedTo.toString()
      : null;

    // Avoid generating duplicate events for a no-op assignment request.
    if (previousAssigneeId === nextAssigneeId) {
      return task;
    }

    // --------------------------------
    // VERIFY NEW ASSIGNEE
    // --------------------------------

    if (nextAssigneeId) {
      if (!mongoose.Types.ObjectId.isValid(nextAssigneeId)) {
        throw new ValidationError(
          "assignedTo must be a valid user ID",
        );
      }

      const assignedUser =
        await User.findById(nextAssigneeId);

      if (!assignedUser) {
        throw new NotFoundError(
          "Assigned user not found",
        );
      }
    }

    // --------------------------------
    // SAVE NEW ASSIGNMENT
    // --------------------------------

    task.assignedTo = nextAssigneeId;

    await task.save();

    const updatedTask =
      await Task.findById(taskId)
        .populate({
          path: "project",
          select: "name key description owner taskSequence",
          populate: {
            path: "owner",
            select: "name email role",
          },
        })
        .populate(
          "owner",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role",
        );

    // Reassigning is two domain events: the previous assignee lost the task
    // and the new assignee received it. Direct unassignment emits only the
    // unassignment event.
    if (previousAssigneeId) {
      taskEvents.emit(
        TASK_EVENTS.UNASSIGNED,
        {
          task: updatedTask,
          userId,
          previousAssigneeId,
        },
      );
    }

    if (nextAssigneeId) {
      taskEvents.emit(
        TASK_EVENTS.ASSIGNED,
        {
          task: updatedTask,
          userId,
        },
      );
    }

    return updatedTask;
  }
}

// ========================================
// SERVICE INSTANCE
// ========================================

const taskService =
  new TaskService();

export default taskService;