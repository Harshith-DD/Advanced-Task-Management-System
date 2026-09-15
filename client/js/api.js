
const API_BASE_URL = "https://127.0.0.1:3000/api";

async function request(
    endpoint,
    options = {}
) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
            credentials: "include"
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
            data?.message ||
            "API request failed"
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

export async function getUsers() {
    const result =
        await request("/users");

    return result.data;
}

export async function assignTask(
    taskId,
    assignedTo
) {
    const result =
        await request(
            `/tasks/${taskId}/assign`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    assignedTo:
                        assignedTo || null
                })
            }
        );

    return result.data;
}

export async function getActivities() {
    const result =
        await request(
            "/activities"
        );

    return result.data;
}

export async function getNotifications() {
    const result =
        await request(
            "/notifications"
        );

    return result.data;
}


export async function markNotificationAsRead(
    notificationId
) {
    const result =
        await request(
            `/notifications/${notificationId}/read`,
            {
                method: "PATCH"
            }
        );

    return result.data;
}


export async function markAllNotificationsAsRead() {
    const result =
        await request(
            "/notifications/read-all",
            {
                method: "PATCH"
            }
        );

    return result.data;
}

export async function getDashboard() {
    const result =
        await request(
            "/dashboard"
        );

    return result.data;
}

export async function getCurrentUser() {
    return request("/auth/me");
}


export async function logoutUser() {
    return request(
        "/auth/logout",
        {
            method: "POST"
        }
    );
}

export async function downloadTaskExport(
    format
) {

    const response =
        await fetch(
            `${API_BASE_URL}/reports/tasks/${format}`,
            {
                credentials: "include"
            }
        );


    if (!response.ok) {

        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {
            // Ignore non-JSON error responses.
        }


        throw new Error(
            data?.message ||
            "Failed to download task export"
        );
    }


    return response.blob();
}

export async function createTaskReport() {
    return request("/reports/tasks/report", {
        method: "POST"
    });
}

export async function getReportStatus(jobId) {
    return request(
        `/reports/jobs/${jobId}`
    );
}

export async function downloadReport(jobId) {
    const response =
        await fetch(
            `${API_BASE_URL}/reports/jobs/${jobId}/download`,
            {
                credentials: "include"
            }
        );

    if (!response.ok) {
        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            // Ignore non-JSON error responses.
        }

        throw new Error(
            data?.message ||
            "Failed to download report"
        );
    }

    return response.blob();
}