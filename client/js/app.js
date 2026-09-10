import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} from "./api.js";

import {
    setTasks,
    getTasksState,
    addTask,
    replaceTask,
    removeTask
} from "./state.js";

import {
    renderTasks
} from "./render.js";


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


async function initializeApp() {
    try {
        const tasks = await getTasks();

        setTasks(tasks);

        renderTasks(tasks);
    } catch (error) {
        console.error(
            "Failed to initialize application:",
            error
        );

        showFormError(
            "Unable to load tasks. Check the server connection."
        );
    }
}


taskForm.addEventListener(
    "submit",
    handleCreateTask
);


async function handleCreateTask(event) {
    event.preventDefault();

    clearFormErrors();

    const taskData =
        getTaskFormData();

    const validationError =
        validateTaskForm(taskData);

    if (validationError) {
        return;
    }

    try {
        const task =
            await createTask(taskData);

        addTask(task);

        renderTasks(
            getTasksState()
        );

        taskForm.reset();

        priorityInput.value = "medium";
        statusInput.value = "pending";

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


function getTaskFormData() {
    const tags = tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

    return {
        title: titleInput.value.trim(),

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


function validateTaskForm(taskData) {
    let hasError = false;

    if (!taskData.title) {
        titleError.textContent =
            "Title is required.";

        hasError = true;
    }

    if (!taskData.description) {
        descriptionError.textContent =
            "Description is required.";

        hasError = true;
    }

    return hasError;
}


function clearFormErrors() {
    titleError.textContent = "";
    descriptionError.textContent = "";
    formError.textContent = "";
}


function showFormError(message) {
    formError.textContent = message;
}


document.addEventListener(
    "change",
    handleStatusChange
);


async function handleStatusChange(event) {
    const statusSelect =
        event.target.closest(".status-select");

    if (!statusSelect) {
        return;
    }

    const taskId =
        statusSelect.dataset.taskId;

    const status =
        statusSelect.value;

    try {
        const updatedTask =
            await updateTask(
                taskId,
                { status }
            );

        replaceTask(updatedTask);

        renderTasks(
            getTasksState()
        );

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


document.addEventListener(
    "click",
    handleTaskAction
);


async function handleTaskAction(event) {
    const deleteButton =
        event.target.closest(".delete-button");

    if (!deleteButton) {
        return;
    }

    const taskId =
        deleteButton.dataset.taskId;

    const shouldDelete =
        window.confirm(
            "Are you sure you want to delete this task?"
        );

    if (!shouldDelete) {
        return;
    }

    try {
        await deleteTask(taskId);

        removeTask(taskId);

        renderTasks(
            getTasksState()
        );

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


export async function loadTask(taskId) {
    try {
        const task =
            await getTaskById(taskId);

        return task;

    } catch (error) {
        console.error(
            "Failed to load task:",
            error
        );

        throw error;
    }
}


initializeApp();