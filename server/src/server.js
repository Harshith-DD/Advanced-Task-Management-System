import "dotenv/config";

import https from "https";
import fs from "fs";

import app from "./app.js";

import {
    startReminderScheduler
} from "./services/reminder_scheduler.js";

import {
    connectDatabase
} from "./config/database.js";

import queueWorker
    from "./workers/queue_worker.js";


const PORT =
    process.env.PORT;


const httpsOptions = {
    key: fs.readFileSync(
        "./certs/localhost+2-key.pem"
    ),

    cert: fs.readFileSync(
        "./certs/localhost+2.pem"
    )
};


// ========================================
// START SERVER
// ========================================

async function startServer() {
    try {

        await connectDatabase();

        startReminderScheduler();

        queueWorker.start();


        https
            .createServer(
                httpsOptions,
                app
            )
            .listen(
                PORT,
                () => {
                    console.log(
                        `HTTPS server is running on https://127.0.0.1:${PORT}`
                    );
                }
            );

    } catch (error) {

        console.error(
            "Failed to start server",
            error
        );

        process.exit(1);
    }
}


startServer();