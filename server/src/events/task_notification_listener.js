import taskEvents, {
    TASK_EVENTS
} from "./task_events.js";

import {
    createNotification
} from "../services/notification_services.js";


// ========================================
// GET RELEVANT USERS
// ========================================

function getRelevantUsers(
    task,
    actorId
) {
    const userIds = [];

    if (task.owner) {
        userIds.push(
            task.owner._id?.toString() ??
            task.owner.toString()
        );
    }

    if (task.assignedTo) {
        userIds.push(
            task.assignedTo._id?.toString() ??
            task.assignedTo.toString()
        );
    }

    return [
        ...new Set(
            userIds.filter(
                (userId) =>
                    userId !== actorId.toString()
            )
        )
    ];
}


// ========================================
// CREATE NOTIFICATIONS FOR TASK EVENT
// ========================================

async function handleTaskNotification(
    eventData,
    eventType
) {
    const {
        task,
        userId
    } = eventData;

    if (!task || !userId) {
        console.error(
            "Invalid task notification event payload"
        );

        return;
    }

    const recipients =
        getRelevantUsers(
            task,
            userId
        );

    if (recipients.length === 0) {
        return;
    }


    let message;

    switch (eventType) {
        case TASK_EVENTS.ASSIGNED:
            message =
                `Task "${task.title}" has been assigned to you`;
            break;

        case TASK_EVENTS.COMPLETED:
            message =
                `Task "${task.title}" has been completed`;
            break;

        case TASK_EVENTS.PRIORITY_CHANGED:
            message =
                `Priority of task "${task.title}" was changed from ${eventData.previousPriority} to ${eventData.newPriority}`;
            break;

        default:
            return;
    }


    try {
        await Promise.all(
            recipients.map(
                (recipientId) =>
                    createNotification({
                        user: recipientId,
                        type: eventType,
                        task: task._id,
                        message
                    })
            )
        );

    } catch (error) {
        console.error(
            `Failed to create notification for ${eventType}:`,
            error
        );
    }
}


// ========================================
// ASSIGNMENT
// ========================================

taskEvents.on(
    TASK_EVENTS.ASSIGNED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.ASSIGNED
        );
    }
);


// ========================================
// COMPLETION
// ========================================

taskEvents.on(
    TASK_EVENTS.COMPLETED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.COMPLETED
        );
    }
);


// ========================================
// PRIORITY CHANGE
// ========================================

taskEvents.on(
    TASK_EVENTS.PRIORITY_CHANGED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.PRIORITY_CHANGED
        );
    }
);