let tasks = [];
let users = [];

let filters = {
    status: "",
    priority: "",
    search: "",
    tag: "",
    fromDate: "",
    toDate: "",
    sortBy: "createdAt",
    sortOrder: "asc",
    page: 1,
    limit: 10
};

let pagination = {
    page: 1,
    limit: 10,
    totalTasks: 0,
    totalPages: 0
};

let notifications = [];

// -------------------------
// Tasks
// -------------------------

export function getTasksState() {
    return tasks;
}

export function setTasks(newTasks) {
    tasks = newTasks;
}


// -------------------------
// Filters
// -------------------------

export function getFilters() {
    return filters;
}

export function setFilters(newFilters) {
    filters = {
        ...filters,
        ...newFilters
    };
}


// -------------------------
// Pagination
// -------------------------

export function getPagination() {
    return pagination;
}

export function setPagination(newPagination) {
    pagination = {
        ...pagination,
        ...newPagination
    };
}

export function getUsersState() {
    return users;
}

export function setUsers(
    newUsers
) {
    users = newUsers;
}

// -------------------------
// Notifications
// -------------------------

export function getNotificationsState() {
    return notifications;
}

export function setNotifications(
    newNotifications
) {
    notifications = newNotifications;
}