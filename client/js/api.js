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


export async function getTasks() {
    const result = await request(
        `${API_BASE_URL}/tasks`
    );

    return result.data;
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


export async function updateTask(taskId, taskData) {
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