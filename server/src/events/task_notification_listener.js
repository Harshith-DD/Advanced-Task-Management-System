import taskEvents, {
    TASK_EVENTS
} from "./task_events.js";

import {
    createNotification
} from "../services/notification_services.js";


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


async function handleTaskNotification(
    eventData,
    eventType
) {
    try {
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

        let recipients;
        let message;

        switch (eventType) {
            case TASK_EVENTS.ASSIGNED:
                if (!task.assignedTo) {
                    return;
                }

                recipients = [
                    task.assignedTo._id?.toString() ??
                    task.assignedTo.toString()
                ];

                message =
                    `Task "${task.title}" has been assigned to you`;
                break;

            case TASK_EVENTS.COMPLETED:
                recipients =
                    getRelevantUsers(
                        task,
                        userId
                    );

                message =
                    `Task "${task.title}" has been completed`;
                break;

            case TASK_EVENTS.PRIORITY_CHANGED:
                recipients =
                    getRelevantUsers(
                        task,
                        userId
                    );

                message =
                    `Priority of task "${task.title}" was changed from ${eventData.previousPriority} to ${eventData.newPriority}`;
                break;

            default:
                return;
        }

        if (recipients.length === 0) {
            return;
        }

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


taskEvents.on(
    TASK_EVENTS.ASSIGNED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.ASSIGNED
        ).catch(
            (error) => {
                console.error(
                    "Unexpected notification listener error:",
                    error
                );
            }
        );
    }
);


taskEvents.on(
    TASK_EVENTS.COMPLETED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.COMPLETED
        ).catch(
            (error) => {
                console.error(
                    "Unexpected notification listener error:",
                    error
                );
            }
        );
    }
);


taskEvents.on(
    TASK_EVENTS.PRIORITY_CHANGED,
    (eventData) => {
        handleTaskNotification(
            eventData,
            TASK_EVENTS.PRIORITY_CHANGED
        ).catch(
            (error) => {
                console.error(
                    "Unexpected notification listener error:",
                    error
                );
            }
        );
    }
);