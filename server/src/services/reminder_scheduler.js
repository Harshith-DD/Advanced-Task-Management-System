import { processTaskReminders } from "./reminder_services.js";

// ========================================
// SCHEDULER CONFIGURATION
// ========================================

const REMINDER_CHECK_INTERVAL = 60 * 1000;

// ========================================
// SCHEDULER STATE
// ========================================

let reminderInterval = null;
let isProcessing = false;

// ========================================
// RUN REMINDER CHECK
// ========================================

async function runReminderCheck() {
  if (isProcessing) {
    console.log(
      "Reminder check already running, skipping this cycle",
    );

    return;
  }

  isProcessing = true;

  try {
    await processTaskReminders();

    console.log("Task reminder check completed");
  } catch (error) {
    console.error(
      "Task reminder check failed",
      error,
    );
  } finally {
    isProcessing = false;
  }
}

// ========================================
// START SCHEDULER
// ========================================

export function startReminderScheduler() {
  if (reminderInterval) {
    return;
  }

  // Run once immediately.
  void runReminderCheck();

  // Continue checking periodically.
  reminderInterval = setInterval(
    runReminderCheck,
    REMINDER_CHECK_INTERVAL,
  );

  console.log("Task reminder scheduler started");
}