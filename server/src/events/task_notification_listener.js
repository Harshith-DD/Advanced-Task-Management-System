import taskEvents, { TASK_EVENTS } from "./task_events.js";

import { addNotificationJob } from "../queue/queues.js";

// ========================================
// REFERENCE HELPERS
// ========================================

function getReferenceId(reference) {
  return reference?._id?.toString() ?? reference?.toString();
}

// ========================================
// FIND RELEVANT TASK STAKEHOLDERS
// ========================================

function getRelevantUsers(task, actorId) {
  const userIds = [
    getReferenceId(task.owner),
    getReferenceId(task.assignedTo),
    getReferenceId(task.project?.owner),
  ].filter(Boolean);

  const actor = actorId.toString();

  return [
    ...new Set(
      userIds.filter((userId) => userId !== actor),
    ),
  ];
}

// ========================================
// CREATE NOTIFICATION
// ========================================

function getTaskLabel(task) {
  if (task.taskKey) {
    return `${task.taskKey} "${task.title}"`;
  }

  return `"${task.title}"`;
}

async function handleTaskNotification(eventData, eventType) {
  try {
    const { task, userId } = eventData;

    if (!task || !userId) {
      console.error(
        "Invalid task notification event payload",
      );

      return;
    }

    let recipients = [];

    let message;

    switch (eventType) {
      case TASK_EVENTS.ASSIGNED: {
        const assignedUserId = getReferenceId(task.assignedTo);

        if (!assignedUserId) {
          return;
        }

        recipients = [assignedUserId];

        message = `Task ${getTaskLabel(task)} has been assigned to you`;

        break;
      }

      case TASK_EVENTS.UNASSIGNED: {
        const previousAssigneeId = eventData.previousAssigneeId?.toString();

        if (!previousAssigneeId) {
          return;
        }

        recipients = [previousAssigneeId];

        message = `Task ${getTaskLabel(task)} has been unassigned from you`;

        break;
      }

      case TASK_EVENTS.COMPLETED:
        recipients = getRelevantUsers(task, userId);

        message = `Task ${getTaskLabel(task)} has been completed`;

        break;

      case TASK_EVENTS.PRIORITY_CHANGED:
        recipients = getRelevantUsers(task, userId);

        message =
          `Priority of task ${getTaskLabel(task)} was changed ` +
          `from ${eventData.previousPriority} ` +
          `to ${eventData.newPriority}`;

        break;

      default:
        return;
    }

    recipients = [
      ...new Set(
        recipients.filter(
          (recipientId) =>
            recipientId !== userId.toString(),
        ),
      ),
    ];

    if (recipients.length === 0) {
      return;
    }

    for (const recipientId of recipients) {
      await addNotificationJob({
        user: recipientId,

        type: eventType,

        task: task._id,

        message,
      });
    }
  } catch (error) {
    console.error(
      `Failed to queue notification for ${eventType}:`,
      error,
    );
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

for (const eventType of [
  TASK_EVENTS.ASSIGNED,
  TASK_EVENTS.UNASSIGNED,
  TASK_EVENTS.COMPLETED,
  TASK_EVENTS.PRIORITY_CHANGED,
]) {
  taskEvents.on(eventType, (eventData) => {
    handleTaskNotification(eventData, eventType).catch((error) => {
      console.error(
        "Unexpected notification listener error:",
        error,
      );
    });
  });
}
