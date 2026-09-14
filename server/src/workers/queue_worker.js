import {
    getNextJob,
    updateJobStatus
} from "../queue/job_queue.js";

import {
    handleJob
} from "./job_handlers.js";

import {
    retry
} from "../utils/retry.js";


const WORKER_POLL_INTERVAL =
    500;

const RETRY_DELAY =
    1000;

let isWorkerBusy = false;


async function processJob(
    job
) {
    console.log(
        `Processing job ${job.id} (${job.type})`
    );

    await retry(
        async () => {
            job.attempts += 1;

            console.log(
                `Attempt ${job.attempts} for job ${job.id}`
            );

            return handleJob(job);
        },
        job.maxAttempts - 1,
        RETRY_DELAY
    );

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
            `Job ${job.id} permanently failed after ${job.attempts} attempts:`,
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