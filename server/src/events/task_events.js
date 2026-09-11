import { EventEmitter } from "events";


// ========================================
// CENTRAL TASK EVENT EMITTER
// ========================================

const taskEvents = new EventEmitter();


// ========================================
// EVENT NAMES
// ========================================

export const TASK_EVENTS = {
    CREATED: "taskCreated",
    UPDATED: "taskUpdated",
    ASSIGNED: "taskAssigned",
    COMPLETED: "taskCompleted",
    PRIORITY_CHANGED: "taskPriorityChanged"
};


// ========================================
// EXPORT EVENT EMITTER
// ========================================

export default taskEvents;