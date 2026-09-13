import {
    createActivity
} from "../services/activity_services.js";

import {
    createNotification
} from "../services/notification_services.js";

import {
    JOB_TYPES
} from "../queue/job_types.js";

export async function handleJob(
    job
) {
    switch (job.type) {
        case JOB_TYPES.ACTIVITY:
            await createActivity(
                job.data
            );
            break;

        case JOB_TYPES.NOTIFICATION:
            await createNotification(
                job.data
            );
            break;

        default:
            throw new Error(
                `Unknown job type: ${job.type}`
            );
    }
}