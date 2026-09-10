const API_BASE_URL = "http://localhost:3000/api";


async function request(url, options = {}) {
    const response = await fetch(url, options);

    let result;

    try {
        result = await response.json();
    } catch (error) {
        result = null;
    }

    if (!response.ok) {
        const message =
            result?.message || "API request failed";

        throw new Error(message);
    }

    return result;
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

    const url = queryString
        ? `${API_BASE_URL}/tasks?${queryString}`
        : `${API_BASE_URL}/tasks`;

    const result = await request(url);

    return result;
}



export async function getTaskById(taskId) {
    const result = await request(
        `${API_BASE_URL}/tasks/${taskId}`
    );

    return result.data;
}


export async function createTask(taskData) {
    const result = await request(
        `${API_BASE_URL}/tasks`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

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
        `${API_BASE_URL}/tasks/${taskId}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(taskData)
        }
    );

    return result.data;
}


export async function deleteTask(taskId) {
    await request(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
            method: "DELETE"
        }
    );
}