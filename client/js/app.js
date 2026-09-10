import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} from "./api.js";

import {
    setTasks,
    setFilters,
    getFilters
} from "./state.js";

import {
    renderTasks
} from "./render.js";


// ========================================
// FORM ELEMENTS
// ========================================

const taskForm =
    document.querySelector("#task-form");

const titleInput =
    document.querySelector("#task-title");

const descriptionInput =
    document.querySelector("#task-description");

const statusInput =
    document.querySelector("#task-status");

const priorityInput =
    document.querySelector("#task-priority");

const dueDateInput =
    document.querySelector("#task-due-date");

const tagsInput =
    document.querySelector("#task-tags");

const titleError =
    document.querySelector("#title-error");

const descriptionError =
    document.querySelector("#description-error");

const formError =
    document.querySelector("#form-error");


// ========================================
// FILTER ELEMENTS
// ========================================

const searchInput =
    document.querySelector("#search-input");

const statusFilter =
    document.querySelector("#status-filter");

const priorityFilter =
    document.querySelector("#priority-filter");


// ========================================
// LOAD TASKS
// ========================================

async function loadTasks() {
    try {
        /*
         * Get the currently selected filters
         * from the application state.
         */
        const filters =
            getFilters();

        /*
         * Send those filters to the API layer.
         *
         * api.js will convert them into
         * query parameters.
         *
         * Example:
         *
         * {
         *     status: "pending",
         *     priority: "high",
         *     search: "meeting"
         * }
         *
         * becomes:
         *
         * /api/tasks?status=pending
         *             &priority=high
         *             &search=meeting
         */
        const tasks =
            await getTasks(filters);

        /*
         * Store the latest tasks in frontend state.
         */
        setTasks(tasks);

        /*
         * Render the tasks received from
         * the backend.
         */
        renderTasks(tasks);

    } catch (error) {
        console.error(
            "Failed to load tasks:",
            error
        );

        showFormError(
            "Unable to load tasks. Check the server connection."
        );
    }
}


// ========================================
// APPLICATION INITIALIZATION
// ========================================

async function initializeApp() {
    await loadTasks();
}


// ========================================
// CREATE TASK
// ========================================

taskForm.addEventListener(
    "submit",
    handleCreateTask
);


async function handleCreateTask(event) {
    /*
     * Prevent the browser from submitting
     * the form normally.
     *
     * Without this, the browser would reload
     * the page.
     */
    event.preventDefault();

    /*
     * Remove previous validation/API errors.
     */
    clearFormErrors();

    /*
     * Collect values from the form.
     */
    const taskData =
        getTaskFormData();

    /*
     * Validate the collected data.
     */
    const validationError =
        validateTaskForm(taskData);

    /*
     * If validation failed, stop here.
     */
    if (validationError) {
        return;
    }

    try {
        /*
         * Send the new task to the backend.
         */
        await createTask(taskData);

        /*
         * Do NOT manually add the returned task
         * to frontend state.
         *
         * Instead, reload the tasks from the backend.
         *
         * This is especially important when filters
         * are active.
         */
        await loadTasks();

        /*
         * Reset the form after successful creation.
         */
        taskForm.reset();

        /*
         * Restore the default form values because
         * reset() returns controls to their HTML
         * default values, and we want these values
         * to be explicit.
         */
        priorityInput.value =
            "medium";

        statusInput.value =
            "pending";

    } catch (error) {
        console.error(
            "Failed to create task:",
            error
        );

        showFormError(
            error.message ||
            "Failed to create task."
        );
    }
}


// ========================================
// READ FORM DATA
// ========================================

function getTaskFormData() {
    /*
     * The tags input contains something like:
     *
     * node, javascript, backend
     *
     * We convert that string into:
     *
     * [
     *     "node",
     *     "javascript",
     *     "backend"
     * ]
     */
    const tags =
        tagsInput.value
            .split(",")
            .map((tag) => tag.trim())
            .filter(
                (tag) => tag.length > 0
            );

    return {
        title:
            titleInput.value.trim(),

        description:
            descriptionInput.value.trim(),

        status:
            statusInput.value,

        priority:
            priorityInput.value,

        dueDate:
            dueDateInput.value || null,

        tags
    };
}


// ========================================
// VALIDATE TASK FORM
// ========================================

function validateTaskForm(taskData) {
    let hasError = false;

    /*
     * Validate title.
     */
    if (!taskData.title) {
        titleError.textContent =
            "Title is required.";

        hasError = true;
    }

    /*
     * Validate description.
     */
    if (!taskData.description) {
        descriptionError.textContent =
            "Description is required.";

        hasError = true;
    }

    return hasError;
}


// ========================================
// FORM ERROR HANDLING
// ========================================

function clearFormErrors() {
    titleError.textContent = "";
    descriptionError.textContent = "";
    formError.textContent = "";
}


function showFormError(message) {
    formError.textContent = message;
}


// ========================================
// STATUS UPDATE
// ========================================

document.addEventListener(
    "change",
    handleStatusChange
);


async function handleStatusChange(event) {
    /*
     * Event delegation:
     *
     * Instead of attaching a change listener
     * to every status <select>, we listen on
     * the document.
     *
     * Then we check whether the changed element
     * is a .status-select.
     */
    const statusSelect =
        event.target.closest(
            ".status-select"
        );

    /*
     * If the changed element is not a task
     * status select, ignore the event.
     */
    if (!statusSelect) {
        return;
    }

    /*
     * Get the task ID from:
     *
     * data-task-id
     */
    const taskId =
        statusSelect.dataset.taskId;

    /*
     * Get the newly selected status.
     */
    const status =
        statusSelect.value;

    try {
        /*
         * Send only the changed field to
         * the backend.
         *
         * Example:
         *
         * PATCH/PUT /api/tasks/123
         *
         * body:
         *
         * {
         *     status: "completed"
         * }
         */
        await updateTask(
            taskId,
            { status }
        );

        /*
         * Reload from the backend.
         *
         * Why?
         *
         * Suppose the current filter is:
         *
         * status = pending
         *
         * and the user changes a task to:
         *
         * completed
         *
         * That task should disappear from the
         * current list.
         *
         * Reloading applies the current filters
         * again.
         */
        await loadTasks();

    } catch (error) {
        console.error(
            "Failed to update task:",
            error
        );

        showFormError(
            error.message ||
            "Failed to update task."
        );
    }
}


// ========================================
// DELETE TASK
// ========================================

document.addEventListener(
    "click",
    handleTaskAction
);


async function handleTaskAction(event) {
    /*
     * Check whether the clicked element,
     * or one of its parents, is a delete button.
     */
    const deleteButton =
        event.target.closest(
            ".delete-button"
        );

    /*
     * If it wasn't a delete button,
     * ignore the event.
     */
    if (!deleteButton) {
        return;
    }

    /*
     * Get the task ID from:
     *
     * data-task-id
     */
    const taskId =
        deleteButton.dataset.taskId;

    /*
     * Ask the user for confirmation.
     */
    const shouldDelete =
        window.confirm(
            "Are you sure you want to delete this task?"
        );

    /*
     * User cancelled.
     */
    if (!shouldDelete) {
        return;
    }

    try {
        /*
         * Delete the task from the backend.
         */
        await deleteTask(taskId);

        /*
         * Reload tasks from the backend.
         *
         * Again, the backend is our source
         * of truth.
         */
        await loadTasks();

    } catch (error) {
        console.error(
            "Failed to delete task:",
            error
        );

        showFormError(
            error.message ||
            "Failed to delete task."
        );
    }
}


// ========================================
// GET ONE TASK
// ========================================

export async function loadTask(taskId) {
    try {
        /*
         * Request one task from the backend.
         */
        const task =
            await getTaskById(taskId);

        return task;

    } catch (error) {
        console.error(
            "Failed to load task:",
            error
        );

        /*
         * Re-throw the error so that the code
         * calling loadTask() can decide what
         * to do with it.
         */
        throw error;
    }
}


// ========================================
// FILTER HANDLING
// ========================================

statusFilter.addEventListener(
    "change",
    handleFilterChange
);

priorityFilter.addEventListener(
    "change",
    handleFilterChange
);

searchInput.addEventListener(
    "input",
    handleFilterChange
);


async function handleFilterChange() {
    /*
     * The HTML select uses:
     *
     * value="all"
     *
     * to represent "no status filter".
     *
     * But "all" is NOT a real status in our
     * MongoDB model.
     *
     * Therefore:
     *
     * "all" -> ""
     *
     * and an empty value means:
     *
     * don't send the status query parameter.
     */
    const status =
        statusFilter.value === "all"
            ? ""
            : statusFilter.value;

    /*
     * Same idea for priority.
     */
    const priority =
        priorityFilter.value === "all"
            ? ""
            : priorityFilter.value;

    /*
     * Read the search text.
     */
    const search =
        searchInput.value.trim();

    /*
     * Store the new filters in frontend state.
     */
    setFilters({
        status,
        priority,
        search
    });

    /*
     * Fetch tasks again using the new filters.
     */
    await loadTasks();
}


// ========================================
// START APPLICATION
// ========================================

initializeApp();
