import {
    getNextJob,
    updateJobStatus
} from "../queue/job_queue.js";

import {
    handleJob
} from "./job_handlers.js";

const WORKER_POLL_INTERVAL =
    500;

let isWorkerBusy = false;

async function processJob(
    job
) {
    console.log(
        `Processing job ${job.id} (${job.type})`
    );

    await handleJob(job);

    console.log(
        `Job ${job.id} completed`
    );
}

async function runWorker() {
    if (isWorkerBusy) {
        return;
    }

    const job =
        getNextJob();

    if (!job) {
        return;
    }

    isWorkerBusy = true;

    updateJobStatus(
        job,
        "processing"
    );

    try {
        await processJob(job);

        updateJobStatus(
            job,
            "completed"
        );

    } catch (error) {
        updateJobStatus(
            job,
            "failed",
            error.message
        );

        console.error(
            `Job ${job.id} failed:`,
            error
        );
    } finally {
        isWorkerBusy = false;
    }
}

export function startQueueWorker() {
    setInterval(
        runWorker,
        WORKER_POLL_INTERVAL
    );

    console.log(
        "Background job worker started"
    );
}