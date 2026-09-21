import Task from "../models/task_model.js";
import Project from "../models/project_model.js";
import Activity from "../models/activity_model.js";
import { buildTaskAccessQuery } from "./task_services.js";
import { getAccessibleTaskIds } from "./activity_services.js";

// ========================================
// GET DASHBOARD
// ========================================

export async function getDashboard(user) {
  const taskQuery = await buildTaskAccessQuery(user);
  const now = new Date();

  const [
    total,
    completed,
    pending,
    overdue,
    byPriority,
    projectStats,
    recentActivity,
  ] = await Promise.all([
    Task.countDocuments(taskQuery),

    Task.countDocuments({
      ...taskQuery,
      status: "completed",
    }),

    // This metric represents all tasks that are not completed.
    Task.countDocuments({
      ...taskQuery,
      status: {
        $ne: "completed",
      },
    }),

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

    getProjectStats(user),
    getRecentActivity(user),
  ]);

  const priorityStats = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const item of byPriority) {
    priorityStats[item._id] = item.count;
  }

  return {
    total,
    completed,
    pending,
    overdue,
    byPriority: priorityStats,
    projects: projectStats,
    recentActivity,
  };
}

// ========================================
// PROJECT STATISTICS
// ========================================

async function getProjectStats(user) {
  // Match the Projects workspace authorization exactly: admins see all
  // projects, while normal users see projects they own.
  const projectQuery =
    user.role === "admin"
      ? {}
      : {
          owner: user.userId,
        };

  const [stats] = await Project.aggregate([
    {
      $match: projectQuery,
    },
    {
      $lookup: {
        from: "tasks",
        let: {
          projectId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [
                  "$project",
                  "$$projectId",
                ],
              },
            },
          },
          {
            $limit: 1,
          },
        ],
        as: "tasks",
      },
    },
    {
      $project: {
        hasTasks: {
          $gt: [
            {
              $size: "$tasks",
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalProjects: {
          $sum: 1,
        },
        activeProjects: {
          $sum: {
            $cond: [
              "$hasTasks",
              1,
              0,
            ],
          },
        },
        emptyProjects: {
          $sum: {
            $cond: [
              "$hasTasks",
              0,
              1,
            ],
          },
        },
      },
    },
  ]);

  return {
    total: stats?.totalProjects ?? 0,
    active: stats?.activeProjects ?? 0,
    empty: stats?.emptyProjects ?? 0,
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
          task: {
            $in: await getAccessibleTaskIds(user),
          },
        };

  if (query.task?.$in && query.task.$in.length === 0) {
    return [];
  }

  return Activity.find(query)
    .populate("user", "name email")
    .populate({
      path: "task",
      select: "title taskKey status priority project",
      populate: {
        path: "project",
        select: "name key",
      },
    })
    .sort({
      createdAt: -1,
    })
    .limit(10);
}
