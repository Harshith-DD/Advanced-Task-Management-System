import taskEvents, { TASK_EVENTS } from "./task_events.js";

import { addJob } from "../queue/job_queue.js";

import { JOB_TYPES } from "../queue/job_types.js";

// ========================================
// CREATE ACTIVITY FOR TASK EVENT
// ========================================

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
        message = `Task "${task.title}" was created`;
        break;

      case TASK_EVENTS.UPDATED:
        message = `Task "${task.title}" was updated`;
        break;

      case TASK_EVENTS.ASSIGNED:
        message = `Task "${task.title}" was assigned`;
        break;

      case TASK_EVENTS.UNASSIGNED:
        message = `Task "${task.title}" was unassigned`;
        break;

      case TASK_EVENTS.COMPLETED:
        message = `Task "${task.title}" was completed`;
        break;

      default:
        return;
    }

    await addJob({
      type: JOB_TYPES.ACTIVITY,
      data: {
        type: eventType,
        task: task._id,
        user: userId,
        message,
      },
    });
  } catch (error) {
    console.error(`Failed to create activity for ${eventType}:`, error);
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
