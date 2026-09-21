import Task from "../models/task_model.js";
import Activity from "../models/activity_model.js";
import { buildTaskAccessQuery } from "./task_services.js";

// ========================================
// GET DASHBOARD
// ========================================

export async function getDashboard(user) {
  // ----------------------------------------
  // CONVERT USER ID TO MONGODB OBJECTID
  // ----------------------------------------

  // ----------------------------------------
  // BUILD TASK ACCESS QUERY
  // ----------------------------------------

  // Keep dashboard visibility aligned with the same authorization rule used
  // by the task API: admins see everything; normal users see owned, assigned,
  // and project-owned tasks.
  const taskQuery = await buildTaskAccessQuery(user);

  // ----------------------------------------
  // DATE FOR OVERDUE TASKS
  // ----------------------------------------

  const now = new Date();

  // ----------------------------------------
  // RUN INDEPENDENT OPERATIONS CONCURRENTLY
  // ----------------------------------------

  const [total, completed, pending, overdue, byPriority, recentActivity] =
    await Promise.all([
      // Total tasks
      Task.countDocuments(taskQuery),

      // Completed tasks
      Task.countDocuments({
        ...taskQuery,
        status: "completed",
      }),

      // Pending / unfinished tasks
      Task.countDocuments({
        ...taskQuery,
        status: {
          $ne: "completed",
        },
      }),

      // Overdue tasks
      Task.countDocuments({
        ...taskQuery,

        dueDate: {
          $lt: now,
          $ne: null,
        },

        status: {
          $ne: "completed",
        },
      }),

      // Tasks grouped by priority
      Task.aggregate([
        {
          $match: taskQuery,
        },

        {
          $group: {
            _id: "$priority",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      // Recent activity
      getRecentActivity(user),
    ]);

  // ----------------------------------------
  // FORMAT PRIORITY RESULTS
  // ----------------------------------------

  const priorityStats = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const item of byPriority) {
    priorityStats[item._id] = item.count;
  }

  // ----------------------------------------
  // RETURN DASHBOARD DATA
  // ----------------------------------------

  return {
    total,
    completed,
    pending,
    overdue,

    byPriority: priorityStats,

    recentActivity,
  };
}

// ========================================
// RECENT ACTIVITY
// ========================================

async function getRecentActivity(user) {
  const query =
    user.role === "admin"
      ? {}
      : {
          user: user.userId,
        };

  return await Activity.find(query)
    .populate("user", "name email")
    .populate("task", "title status priority")
    .sort({
      createdAt: -1,
    })
    .limit(10);
}
