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
  limit: 10,
};

let pagination = {
  page: 1,
  limit: 10,
  totalTasks: 0,
  totalPages: 0,
};

let notifications = [];

const createDefaultDashboard = () => ({
  total: 0,
  completed: 0,
  pending: 0,
  overdue: 0,
  byPriority: {
    low: 0,
    medium: 0,
    high: 0,
  },
  recentActivity: [],
});

let dashboard = createDefaultDashboard();

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
    ...newFilters,
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
    ...newPagination,
  };
}

// -------------------------
// Users
// -------------------------

export function getUsersState() {
  return users;
}

export function setUsers(newUsers) {
  users = newUsers;
}

// -------------------------
// Notifications
// -------------------------

export function getNotificationsState() {
  return notifications;
}

export function setNotifications(newNotifications) {
  notifications = newNotifications;
}

// -------------------------
// Dashboard
// -------------------------

export function getDashboardState() {
  return dashboard;
}

export function setDashboard(newDashboard) {
  dashboard = newDashboard;
}

export function resetDashboard() {
  dashboard = createDefaultDashboard();
}
