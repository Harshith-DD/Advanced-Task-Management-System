import { Worker } from "bullmq";

import { getRedisConnectionOptions } from "../config/redis.js";

import {
  REPORT_QUEUE_NAME,
  ACTIVITY_QUEUE_NAME,
  NOTIFICATION_QUEUE_NAME,
} from "../queue/queues.js";

import { generateTaskReportForUser } from "../reports/report_service.js";

import { createActivity } from "../services/activity_services.js";

import notificationService from "../services/notification_services.js";

// ========================================
// WORKER STATE
// ========================================

let reportWorker = null;

let activityWorker = null;

let notificationWorker = null;

// ========================================
// REPORT WORKER
// ========================================

function startReportWorker() {
  return new Worker(
    REPORT_QUEUE_NAME,

    async (job) => {
      console.log(`Processing report job ${job.id}`);

      const userId = job.data.userId ?? job.data.user?.userId;

      if (!userId) {
        throw new Error("Report job is missing the user ID");
      }

      const result = await generateTaskReportForUser(userId);

      console.log(`Report job ${job.id} completed`);

      return result;
    },

    {
      connection: getRedisConnectionOptions({
        worker: true,
      }),

      concurrency: 1,
    },
  );
}

// ========================================
// ACTIVITY WORKER
// ========================================

function startActivityWorker() {
  return new Worker(
    ACTIVITY_QUEUE_NAME,

    async (job) => {
      console.log(`Processing activity job ${job.id}`);

      const result = await createActivity(job.data);

      console.log(`Activity job ${job.id} completed`);

      return result;
    },

    {
      connection: getRedisConnectionOptions({
        worker: true,
      }),

      concurrency: 5,
    },
  );
}

// ========================================
// NOTIFICATION WORKER
// ========================================

function startNotificationWorker() {
  return new Worker(
    NOTIFICATION_QUEUE_NAME,

    async (job) => {
      console.log(`Processing notification job ${job.id}`);

      const result =
        await notificationService.createNotification(job.data);

      console.log(`Notification job ${job.id} completed`);

      return result;
    },

    {
      connection: getRedisConnectionOptions({
        worker: true,
      }),

      concurrency: 5,
    },
  );
}

// ========================================
// START WORKERS
// ========================================

export function startBullMQWorker() {
  if (reportWorker || activityWorker || notificationWorker) {
    return;
  }

  reportWorker = startReportWorker();

  activityWorker = startActivityWorker();

  notificationWorker = startNotificationWorker();

  // ======================================
  // REPORT EVENTS
  // ======================================

  reportWorker.on("completed", (job) => {
    console.log(`BullMQ report job ${job.id} completed`);
  });

  reportWorker.on("failed", (job, error) => {
    console.error(
      `BullMQ report job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  });

  // ======================================
  // ACTIVITY EVENTS
  // ======================================

  activityWorker.on("completed", (job) => {
    console.log(`BullMQ activity job ${job.id} completed`);
  });

  activityWorker.on("failed", (job, error) => {
    console.error(
      `BullMQ activity job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  });

  // ======================================
  // NOTIFICATION EVENTS
  // ======================================

  notificationWorker.on("completed", (job) => {
    console.log(`BullMQ notification job ${job.id} completed`);
  });

  notificationWorker.on("failed", (job, error) => {
    console.error(
      `BullMQ notification job ${job?.id ?? "unknown"} failed:`,
      error,
    );
  });

  // ======================================
  // WORKER ERRORS
  // ======================================

  reportWorker.on("error", (error) => {
    console.error("BullMQ report worker error:", error);
  });

  activityWorker.on("error", (error) => {
    console.error("BullMQ activity worker error:", error);
  });

  notificationWorker.on("error", (error) => {
    console.error("BullMQ notification worker error:", error);
  });

  console.log("BullMQ report worker started");

  console.log("BullMQ activity worker started");

  console.log("BullMQ notification worker started");
}