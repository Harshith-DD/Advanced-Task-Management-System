import { getToken } from "./auth.js";

const API_BASE_URL = "http://localhost:3000/api";

async function request(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.message || "API request failed"
        );
    }

    return data;
}


export async function getTasks(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) {
        params.set("status", filters.status);
    }

    if (filters.priority) {
        params.set("priority", filters.priority);
    }

    if (filters.search) {
        params.set("search", filters.search);
    }

    if (filters.tag) {
        params.set("tag", filters.tag);
    }

    if (filters.fromDate) {
        params.set("fromDate", filters.fromDate);
    }

    if (filters.toDate) {
        params.set("toDate", filters.toDate);
    }

    if (filters.sortBy) {
        params.set("sortBy", filters.sortBy);
    }

    if (filters.sortOrder) {
        params.set("sortOrder", filters.sortOrder);
    }

    if (filters.page) {
        params.set("page", filters.page);
    }

    if (filters.limit) {
        params.set("limit", filters.limit);
    }

    const queryString = params.toString();

    const endpoint = queryString
        ? `/tasks?${queryString}`
        : "/tasks";

    const result = await request(endpoint);

    return result;
}


export async function getTaskById(taskId) {
    const result = await request(
        `/tasks/${taskId}`
    );

    return result.data;
}


export async function createTask(taskData) {
    const result = await request(
        "/tasks",
        {
            method: "POST",

            body: JSON.stringify(taskData)
        }
    );

    return result.data;
}


export async function updateTask(
    taskId,
    taskData
) {
    const result = await request(
        `/tasks/${taskId}`,
        {
            method: "PUT",

            body: JSON.stringify(taskData)
        }
    );

    return result.data;
}


export async function deleteTask(taskId) {
    await request(
        `/tasks/${taskId}`,
        {
            method: "DELETE"
        }
    );
}


export async function registerUser(userData) {
    return request(
        "/auth/register",
        {
            method: "POST",
            body: JSON.stringify(userData)
        }
    );
}


export async function loginUser(credentials) {
    return request(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify(credentials)
        }
    );
}
