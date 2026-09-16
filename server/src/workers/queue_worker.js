import {
  getNextJob,
  updateJobStatus,
  updateJobAttempts,
  touchJob,
} from "../queue/job_queue.js";

import { handleJob } from "./job_handlers.js";

import { retry } from "../utils/retry.js";

class QueueWorker {
  constructor() {
    this.pollInterval = 500;
    this.retryDelay = 1000;
    this.heartbeatInterval = 60 * 1000;
    this.isBusy = false;
  }

  async processJob(job) {
    console.log(`Processing job ${job.id} (${job.type})`);

    const heartbeat = setInterval(async () => {
      try {
        await touchJob(job.id, job.leaseId);
      } catch (error) {
        console.error(`Failed to refresh lease for job ${job.id}:`, error);
      }
    }, this.heartbeatInterval);

    try {
      const remainingRetries = job.maxAttempts - job.attempts - 1;

      const result = await retry(
        async () => {
          job.attempts += 1;

          await updateJobAttempts(job.id, job.attempts, job.leaseId);

          console.log(`Attempt ${job.attempts} for job ${job.id}`);

          return handleJob(job);
        },
        remainingRetries,
        this.retryDelay,
      );

      console.log(`Job ${job.id} completed`);

      return result;
    } finally {
      clearInterval(heartbeat);
    }
  }

  async runWorker() {
    if (this.isBusy) return;

    try {
      const job = await getNextJob();

      if (!job) return;

      this.isBusy = true;

      try {
        const result = await this.processJob(job);

        await updateJobStatus(job.id, "completed", null, result, job.leaseId);
      } catch (error) {
        await updateJobStatus(
          job.id,
          "failed",
          error.message,
          null,
          job.leaseId,
        );

        console.error(
          `Job ${job.id} permanently failed after ${job.attempts} attempts:`,
          error,
        );
      } finally {
        this.isBusy = false;
      }
    } catch (error) {
      console.error("Queue worker polling failed:", error);
    }
  }

  start() {
    setInterval(this.runWorker.bind(this), this.pollInterval);

    console.log("Background job worker started");
  }
}

const queueWorker = new QueueWorker();

export default queueWorker;
