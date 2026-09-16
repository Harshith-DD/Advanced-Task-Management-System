import Job from "../models/job_model.js";
import crypto from "crypto";

const STALE_JOB_TIMEOUT_MS = 5 * 60 * 1000;

export async function addJob(job) {
  const queuedJob = await Job.create({
    type: job.type,
    data: job.data,
    status: "pending",
    maxAttempts: 3,
  });

  return queuedJob;
}

export async function getNextJob() {
  const now = new Date();

  const staleTime = new Date(now.getTime() - STALE_JOB_TIMEOUT_MS);

  const leaseId = crypto.randomUUID();

  const job = await Job.findOneAndUpdate(
    {
      $or: [
        {
          status: "pending",
        },
        {
          status: "processing",
          startedAt: {
            $lt: staleTime,
          },
        },
      ],
    },
    {
      $set: {
        status: "processing",
        startedAt: now,
        leaseId,
      },
    },
    {
      sort: {
        createdAt: 1,
      },
      returnDocument: "after",
    },
  );

  return job;
}

export async function touchJob(jobId, leaseId) {
  return Job.findOneAndUpdate(
    {
      id: jobId,
      status: "processing",
      leaseId,
    },
    {
      $set: {
        startedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );
}

export async function updateJobStatus(
  jobId,
  status,
  error = null,
  result = null,
  leaseId,
) {
  const update = {
    status,
  };

  if (status === "processing") {
    update.startedAt = new Date();
  }

  if (status === "completed") {
    update.completedAt = new Date();
    update.result = result;
  }

  if (status === "failed") {
    update.failedAt = new Date();
    update.error = error;
  }

  return Job.findOneAndUpdate(
    {
      id: jobId,
      status: "processing",
      leaseId,
    },
    { $set: update },
    {
      returnDocument: "after",
    },
  );
}

export async function updateJobAttempts(jobId, attempts, leaseId) {
  return Job.findOneAndUpdate(
    {
      id: jobId,
      status: "processing",
      leaseId,
    },
    {
      $set: {
        attempts,
      },
    },
    {
      returnDocument: "after",
    },
  );
}

export async function getJobById(jobId) {
  return Job.findOne({
    id: jobId,
  });
}
