import crypto from "crypto";


// ========================================
// IN-MEMORY JOB QUEUE
// ========================================

const jobs = [];


// ========================================
// ADD JOB
// ========================================

export function addJob(job) {
    const queuedJob = {
        id: crypto.randomUUID(),
        type: job.type,
        data: job.data,
        status: "pending",
        createdAt: new Date(),
        startedAt: null,
        completedAt: null,
        failedAt: null,
        error: null,
        attempts: 0,
        maxAttempts: 3
    };

    jobs.push(queuedJob);

    return queuedJob;
}

// ========================================
// GET NEXT PENDING JOB
// ========================================

export function getNextJob() {
    return jobs.find(
        (job) =>
            job.status === "pending"
    );
}


// ========================================
// UPDATE JOB STATUS
// ========================================

export function updateJobStatus(
    job,
    status,
    error = null
) {
    job.status = status;

    if (status === "processing") {
        job.startedAt = new Date();
    }

    if (status === "completed") {
        job.completedAt = new Date();
    }

    if (status === "failed") {
        job.failedAt = new Date();
        job.error = error;
    }

    return job;
}


// ========================================
// GET ALL JOBS
// ========================================

export function getJobs() {
    return jobs;
}