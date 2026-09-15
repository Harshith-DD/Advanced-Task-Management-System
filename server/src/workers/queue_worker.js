import {
    getNextJob,
    updateJobStatus,
    updateJobAttempts
} from "../queue/job_queue.js";

import { handleJob } from "./job_handlers.js";

import { retry } from "../utils/retry.js";


class QueueWorker {

    constructor() {
        this.pollInterval = 500;
        this.retryDelay = 1000;
        this.isBusy = false;
    }


async processJob(job) {
    console.log(
        `Processing job ${job.id} (${job.type})`
    );

    const remainingRetries =
        job.maxAttempts - job.attempts - 1;

    const result = await retry(
        async () => {
            job.attempts += 1;

            await updateJobAttempts(
                job.id,
                job.attempts
            );

            console.log(
                `Attempt ${job.attempts} for job ${job.id}`
            );

            return handleJob(job);
        },
        remainingRetries,
        this.retryDelay
    );

    console.log(`Job ${job.id} completed`);

    return result;
}


async runWorker() {
    if (this.isBusy) return;

    const job = await getNextJob();

    if (!job) return;

    this.isBusy = true;

    try {
        const result = await this.processJob(job);

        await updateJobStatus(
            job.id,
            "completed",
            null,
            result
        );
    } catch (error) {
        await updateJobStatus(
            job.id,
            "failed",
            error.message
        );

        console.error(
            `Job ${job.id} permanently failed after ${job.attempts} attempts:`,
            error
        );
    } finally {
        this.isBusy = false;
    }
}


start() {

    setInterval(
        this.runWorker.bind(this),
        this.pollInterval
    );

    console.log(
        "Background job worker started"
    );
}
}


const queueWorker = new QueueWorker();

export default queueWorker;