import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    registerUser,
    loginUser,
    getUsers,
    assignTask,
    getActivities,
    getNotifications,
    getDashboard,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "./api.js";

import {
    saveAuth,
    getUser,
    isLoggedIn,
    logout
} from "./auth.js";




import {
    setTasks,
    getFilters,
    setFilters,
    getPagination,
    setPagination,
    getUsersState,
    setUsers,
    setNotifications,
    setDashboard,
    resetDashboard
} from "./state.js";

import {
    renderTasks,
    renderActivities,
    renderNotifications,
    renderDashboard
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

const searchButton =
    document.querySelector("#search-button");


const statusFilter =
    document.querySelector("#status-filter");

const priorityFilter =
    document.querySelector("#priority-filter");

const tagFilter =
    document.querySelector("#tag-filter");

const fromDateFilter =
    document.querySelector("#from-date-filter");

const toDateFilter =
    document.querySelector("#to-date-filter");

const sortBy =
    document.querySelector("#sort-by");

const sortOrder =
    document.querySelector("#sort-order");

const previousPageButton =
    document.querySelector("#previous-page");

const nextPageButton =
    document.querySelector("#next-page");

const pageNumbers =
    document.querySelector("#page-numbers");

const pageLimit =
    document.querySelector("#page-limit");


//===================================
//AUTH ELEMENTS
//===================================

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginContainer =
    document.getElementById("login-container");

const registerContainer =
    document.getElementById("register-container");

const userContainer =
    document.getElementById("user-container");

const authStatus =
    document.getElementById("auth-status");

const userInfo =
    document.getElementById("user-info");

const logoutButton =
    document.getElementById("logout-button");

const loginError =
    document.getElementById("login-error");

const registerError =
    document.getElementById("register-error");

const markAllNotificationsReadButton =
    document.getElementById(
        "mark-all-notifications-read"
    );
// ========================================
// LOAD TASKS
// ========================================

async function loadTasks() {
    try {
        const filters = getFilters();

        const result = await getTasks(filters);

        setTasks(result.data);

        setPagination(result.pagination);

        const users =
    getUsersState();

const currentUser =
    getUser();

renderTasks(
    result.data,
    users,
    currentUser
);

        renderPagination(result.pagination);


    } catch (error) {
        console.error("Failed to load tasks:", error);
    }
}

async function loadActivities() {
    try {
        const activities =
            await getActivities();

        renderActivities(
            activities
        );
    } catch (error) {
        console.error(
            "Failed to load activities:",
            error
        );
    }
}

async function loadNotifications() {
    try {
        const notifications =
            await getNotifications();

        setNotifications(
            notifications
        );

        renderNotifications(
            notifications
        );
    } catch (error) {
        console.error(
            "Failed to load notifications:",
            error
        );
    }
}


// ========================================
// APPLICATION INITIALIZATION
// ========================================


async function initializeApp() {
    updateAuthUI();

    if (!isLoggedIn()) {
        return;
    }
    await loadUsers();
    await Promise.all([
        loadTasks(),
        loadActivities(),
        loadNotifications(),
        loadDashboard()
    ]);
}


//==========================================
//AUTH FUNC
//==========================================

function updateAuthUI() {
    const loggedIn = isLoggedIn();

    if (loggedIn) {
        const user = getUser();

        loginContainer.hidden = true;
        registerContainer.hidden = true;
        userContainer.hidden = false;

        authStatus.textContent = "You are logged in.";

        if (user) {
            userInfo.textContent =
    `Logged in as ${user.name} (${user.email}) — Role: ${user.role}`;
        }
    } else {
        loginContainer.hidden = false;
        registerContainer.hidden = false;
        userContainer.hidden = true;

        authStatus.textContent =
            "You are not logged in.";

        userInfo.textContent = "";
    }
}

if (registerForm) {
    registerForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            registerError.textContent = "";

            const formData =
                new FormData(registerForm);

            const name =
                formData.get("name").trim();

            const email =
                formData.get("email").trim();

            const password =
                formData.get("password");

            if (!name || !email || !password) {
                registerError.textContent =
                    "All fields are required.";

                return;
            }

            try {
                await registerUser({
                    name,
                    email,
                    password
                });

                registerForm.reset();

                registerError.textContent =
                    "Registration successful. Please log in.";
            } catch (error) {
                registerError.textContent =
                    error.message;
            }
        }
    );
}

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            loginError.textContent = "";

            const formData =
                new FormData(loginForm);

            const email =
                formData.get("email").trim();

            const password =
                formData.get("password");

            if (!email || !password) {
                loginError.textContent =
                    "Email and password are required.";

                return;
            }

            try {
                const result = await loginUser({
                    email,
                    password
                });

                saveAuth(result.data);

                loginForm.reset();

                updateAuthUI();
                await loadUsers();

                await Promise.all([
                    loadTasks(),
                    loadActivities(),
                    loadNotifications(),
                    loadDashboard()
                ]);

            } catch (error) {
                loginError.textContent =
                    error.message;
            }
        }
    );
}

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        () => {
            logout();

            updateAuthUI();

            setTasks([]);

            setUsers([]);

            setNotifications([]);

            resetDashboard();


            setPagination({
                page: 1,
                totalPages: 1,
                totalTasks: 0
            });

            renderTasks([]);
        }
    );
}

async function loadUsers() {
    try {
        const users =
            await getUsers();

        setUsers(users);

    } catch (error) {
        console.error(
            "Failed to load users:",
            error
        );

        setUsers([]);
    }
}

// ========================================
// CREATE TASK
// ========================================

taskForm.addEventListener(
    "submit",
    handleCreateTask
);

document.addEventListener(
    "click",
    handleNotificationAction
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
        await Promise.all([
            loadTasks(),
            loadActivities(),
            loadDashboard()
        ]);
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

async function handleNotificationAction(
    event
) {
    const markReadButton =
        event.target.closest(
            ".mark-read-button"
        );

    if (!markReadButton) {
        return;
    }

    const notificationId =
        markReadButton.dataset.notificationId;

    try {
        await markNotificationAsRead(
            notificationId
        );

        await loadNotifications();
    } catch (error) {
        console.error(
            "Failed to mark notification as read:",
            error
        );
    }
}

if (
    markAllNotificationsReadButton
) {
    markAllNotificationsReadButton.addEventListener(
        "click",
        handleMarkAllNotificationsRead
    );
}

async function handleMarkAllNotificationsRead() {
    try {
        await markAllNotificationsAsRead();

        await loadNotifications();
    } catch (error) {
        console.error(
            "Failed to mark all notifications as read:",
            error
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
        await Promise.all([
            loadTasks(),
            loadActivities(),
            loadDashboard()
        ]);

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
// PRIORITY UPDATE
// ========================================

document.addEventListener(
    "change",
    handlePriorityChange
);


async function handlePriorityChange(event) {
    const prioritySelect =
        event.target.closest(
            ".priority-select"
        );

    if (!prioritySelect) {
        return;
    }

    const taskId =
        prioritySelect.dataset.taskId;

    const priority =
        prioritySelect.value;

    try {
        await updateTask(
            taskId,
            { priority }
        );

        await Promise.all([
            loadTasks(),
            loadActivities(),
            loadDashboard()
        ]);

    } catch (error) {
        console.error(
            "Failed to update task priority:",
            error
        );

        showFormError(
            error.message ||
            "Failed to update task priority."
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
        await Promise.all([
            loadTasks(),
            loadDashboard()
        ]);

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

//=========================
//DASHBOARD HANDLING
//=========================
async function loadDashboard() {
    try {

        const dashboard =
            await getDashboard();

        setDashboard(
            dashboard
        );

        renderDashboard(
            dashboard
        );

    } catch (error) {

        console.error(
            "Failed to load dashboard:",
            error
        );
    }
}

// ========================================
// FILTER HANDLING
// ========================================


searchButton.addEventListener(
    "click",
    handleFilterChange
);


async function handleFilterChange() {

    const status =
        statusFilter.value === "all"
            ? ""
            : statusFilter.value;


    const priority =
        priorityFilter.value === "all"
            ? ""
            : priorityFilter.value;


    const search =
        searchInput.value.trim();


    const tag =
        tagFilter.value.trim();


    const fromDate =
        fromDateFilter.value;


    const toDate =
        toDateFilter.value;


    const sortByValue =
        sortBy.value;


    const sortOrderValue =
        sortOrder.value;


    setFilters({

        status,

        priority,

        search,

        tag,

        fromDate,

        toDate,

        sortBy: sortByValue,

        sortOrder: sortOrderValue
    });


    await loadTasks();
}

//==========================
//PAGINATION
//=========================
function renderPagination(pagination) {
    const {
        page,
        totalPages
    } = pagination;

    pageNumbers.innerHTML = "";

    previousPageButton.disabled =
        page <= 1;

    nextPageButton.disabled =
        page >= totalPages;

    if (totalPages <= 1) {
        return;
    }

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = pageNumber;

        if (pageNumber === page) {
            button.disabled = true;
        }

        button.addEventListener("click", () => {
            goToPage(pageNumber);
        });

        pageNumbers.appendChild(button);
    }
}
async function goToPage(pageNumber) {
    const pagination = getPagination();

    if (
        pageNumber < 1 ||
        pageNumber > pagination.totalPages
    ) {
        return;
    }

    setFilters({
        page: pageNumber
    });

    await loadTasks();
}

previousPageButton.addEventListener(
    "click",
    async () => {
        const pagination = getPagination();

        if (pagination.page <= 1) {
            return;
        }

        await goToPage(
            pagination.page - 1
        );
    }
);

nextPageButton.addEventListener(
    "click",
    async () => {
        const pagination = getPagination();

        if (
            pagination.page >=
            pagination.totalPages
        ) {
            return;
        }

        await goToPage(
            pagination.page + 1
        );
    }
);
pageLimit.addEventListener(
    "change",
    async () => {
        const limit =
            Number(pageLimit.value);

        setFilters({
            page: 1,
            limit
        });

        await loadTasks();
    }
);
document.addEventListener(
    "change",
    async (event) => {
        const assignmentSelect =
            event.target.closest(
                ".assignment-select"
            );

        if (!assignmentSelect) {
            return;
        }

        const taskId =
            assignmentSelect.dataset.taskId;

        const assignedTo =
            assignmentSelect.value;

        try {
            await assignTask(
                taskId,
                assignedTo
            );

            await Promise.all([
            loadTasks(),
            loadActivities(),
            loadDashboard()
        ]);

        } catch (error) {
            console.error(
                "Failed to assign task:",
                error
            );

            alert(error.message);
        }
    }
);
// ========================================
// START APPLICATION
// ========================================

initializeApp();
