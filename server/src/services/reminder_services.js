import Task from "../models/task_model.js";

import { addNotificationJob } from "../queue/queues.js";

// ========================================
// REMINDER CONFIGURATION
// ========================================

const REMINDER_WINDOW_MS = 60 * 60 * 1000;

// ========================================
// PROCESS REMINDERS AND OVERDUE TASKS
// ========================================

export async function processTaskReminders() {
  const now = new Date();

  const reminderLimit = new Date(
    now.getTime() + REMINDER_WINDOW_MS,
  );

  const tasks = await Task.find({
    dueDate: {
      $ne: null,
      $lte: reminderLimit,
    },
  })
    .populate("owner", "_id")
    .populate("assignedTo", "_id");

  for (const task of tasks) {
    const dueDate = new Date(task.dueDate);

    // ====================================
    // COMPLETED TASK
    // ====================================

    if (task.status === "completed") {
      if (task.isOverdue) {
        task.isOverdue = false;

        await task.save();
      }

      continue;
    }

    // ====================================
    // OVERDUE TASK
    // ====================================

    if (dueDate < now) {
      if (!task.isOverdue) {
        task.isOverdue = true;

        await task.save();
      }

      continue;
    }

    // ====================================
    // UPCOMING TASK
    // ====================================

    if (!task.reminderSentAt) {
      const recipient =
        task.assignedTo?._id || task.owner?._id;

      if (!recipient) {
        continue;
      }

      await addNotificationJob({
        user: recipient,

        type: "taskReminder",

        task: task._id,

        message: `Task "${task.title}" is due soon`,
      });

      task.reminderSentAt = new Date();

      await task.save();
    }
  }
}