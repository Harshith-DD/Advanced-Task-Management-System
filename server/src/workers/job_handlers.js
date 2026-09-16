import { createActivity } from "../services/activity_services.js";

import notificationService from "../services/notification_services.js";

import { generateTaskReport } from "../reports/report_service.js";

import { JOB_TYPES } from "../queue/job_types.js";

export async function handleJob(job) {
  switch (job.type) {
    case JOB_TYPES.ACTIVITY:
      await createActivity(job.data);
      break;

    case JOB_TYPES.NOTIFICATION:
      await notificationService.createNotification(job.data);
      break;

    case JOB_TYPES.REPORT:
      return await generateTaskReport(job.data.user);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
