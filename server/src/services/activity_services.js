import Activity from "../models/activity_model.js";
import Task from "../models/task_model.js";

import { buildTaskAccessQuery } from "./task_services.js";

// ========================================
// CREATE ACTIVITY
// ========================================

export async function createActivity(activityData) {
  return await Activity.create(activityData);
}

// ========================================
// GET ACCESSIBLE TASK IDS
// ========================================

export async function getAccessibleTaskIds(user) {
  const taskQuery = await buildTaskAccessQuery(user);

  return await Task.distinct("_id", taskQuery);
}

// ========================================
// GET ACTIVITIES
// ========================================

export async function getActivities(user) {
  if (user.role !== "admin") {
    const taskIds = await getAccessibleTaskIds(user);

    if (taskIds.length === 0) {
      return [];
    }

    return await Activity.find({
      task: { $in: taskIds },
    })
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
      .limit(50);
  }

  return await Activity.find({})
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
    .limit(50);
}
