import { Queue } from "bullmq";
import crypto from "crypto";

import { getRedisConnectionOptions } from "../config/redis.js";

// ========================================
// QUEUE NAMES
// ========================================

export const REPORT_QUEUE_NAME = "taskflow-reports";

export const ACTIVITY_QUEUE_NAME = "taskflow-activities";

export const NOTIFICATION_QUEUE_NAME = "taskflow-notifications";

// ========================================
// DEFAULT OPTIONS
// ========================================

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,

  backoff: {
    type: "fixed",
    delay: 1000,
  },

  removeOnComplete: {
    age: 60 * 60,
    count: 100,
  },

  removeOnFail: {
    age: 24 * 60 * 60,
    count: 100,
  },
};

// ========================================
// QUEUE INSTANCES
// ========================================

let reportQueue = null;

let activityQueue = null;

let notificationQueue = null;

// ========================================
// QUEUE FACTORY
// ========================================

function createQueue(name) {
  return new Queue(name, {
    connection: getRedisConnectionOptions(),

    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

// ========================================
// GET REPORT QUEUE
// ========================================

function getReportQueue() {
  if (!reportQueue) {
    reportQueue = createQueue(REPORT_QUEUE_NAME);
  }

  return reportQueue;
}

// ========================================
// GET ACTIVITY QUEUE
// ========================================

function getActivityQueue() {
  if (!activityQueue) {
    activityQueue = createQueue(ACTIVITY_QUEUE_NAME);
  }

  return activityQueue;
}

// ========================================
// GET NOTIFICATION QUEUE
// ========================================

function getNotificationQueue() {
  if (!notificationQueue) {
    notificationQueue = createQueue(NOTIFICATION_QUEUE_NAME);
  }

  return notificationQueue;
}

// ========================================
// REPORT JOBS
// ========================================

export async function addReportJob(user) {
  return getReportQueue().add(
    "generate-task-report",
    {
      userId: user.userId,
    },
    {
      jobId: crypto.randomUUID(),
    },
  );
}

export function getReportJob(jobId) {
  return getReportQueue().getJob(jobId);
}

// ========================================
// ACTIVITY JOBS
// ========================================

export async function addActivityJob(data) {
  return getActivityQueue().add(
    "create-activity",
    data,
    {
      jobId: crypto.randomUUID(),
    },
  );
}

// ========================================
// NOTIFICATION JOBS
// ========================================

export async function addNotificationJob(data) {
  return getNotificationQueue().add(
    "create-notification",
    data,
    {
      jobId: crypto.randomUUID(),
    },
  );
}