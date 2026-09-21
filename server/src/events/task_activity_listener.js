import taskEvents, { TASK_EVENTS } from "./task_events.js";

import { addActivityJob } from "../queue/queues.js";

// ========================================
// CREATE ACTIVITY FOR TASK EVENT
// ========================================

function getTaskLabel(task) {
  if (task.taskKey) {
    return `${task.taskKey} "${task.title}"`;
  }

  return `"${task.title}"`;
}

async function handleTaskActivity(eventData, eventType) {
  try {
    const { task, userId } = eventData;

    if (!task || !userId) {
      console.error("Invalid task activity event payload");

      return;
    }

    let message;

    switch (eventType) {
      case TASK_EVENTS.CREATED:
        message = `Task ${getTaskLabel(task)} was created`;
        break;

      case TASK_EVENTS.UPDATED: {
        const changes = eventData.changes ?? [];

        message = changes.length
          ? `Task ${getTaskLabel(task)} was updated: ${changes.join(", ")}`
          : `Task ${getTaskLabel(task)} was updated`;

        break;
      }

      case TASK_EVENTS.ASSIGNED:
        message = `Task ${getTaskLabel(task)} was assigned`;
        break;

      case TASK_EVENTS.UNASSIGNED:
        message = `Task ${getTaskLabel(task)} was unassigned`;
        break;

      case TASK_EVENTS.PRIORITY_CHANGED:
        message =
          `Task ${getTaskLabel(task)} priority changed from ` +
          `${eventData.previousPriority} to ${eventData.newPriority}`;
        break;

      case TASK_EVENTS.COMPLETED:
        message = `Task ${getTaskLabel(task)} was completed`;
        break;

      default:
        return;
    }

    await addActivityJob({
      type: eventType,

      task: task._id,

      user: userId,

      message,
    });
  } catch (error) {
    console.error(
      `Failed to queue activity for ${eventType}:`,
      error,
    );
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

taskEvents.on(TASK_EVENTS.CREATED, (eventData) => {
  handleTaskActivity(eventData, TASK_EVENTS.CREATED);
});

taskEvents.on(TASK_EVENTS.UPDATED, (eventData) => {
  handleTaskActivity(eventData, TASK_EVENTS.UPDATED);
});

taskEvents.on(TASK_EVENTS.ASSIGNED, (eventData) => {
  handleTaskActivity(eventData, TASK_EVENTS.ASSIGNED);
});

taskEvents.on(TASK_EVENTS.UNASSIGNED, (eventData) => {
  handleTaskActivity(eventData, TASK_EVENTS.UNASSIGNED);
});

taskEvents.on(TASK_EVENTS.COMPLETED, (eventData) => {
  handleTaskActivity(eventData, TASK_EVENTS.COMPLETED);
});

taskEvents.on(TASK_EVENTS.PRIORITY_CHANGED, (eventData) => {
  handleTaskActivity(
    eventData,
    TASK_EVENTS.PRIORITY_CHANGED,
  );
});