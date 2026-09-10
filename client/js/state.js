let tasks = [];


const filters = {
    status: "",
    priority: "",
    search: ""
};


export function setTasks(newTasks) {
    tasks = newTasks;
}


export function getTasksState() {
    return tasks;
}


export function addTask(task) {
    tasks.push(task);
}


export function replaceTask(updatedTask) {
    tasks = tasks.map((task) => {
        if (task._id === updatedTask._id) {
            return updatedTask;
        }

        return task;
    });
}


export function removeTask(taskId) {
    tasks = tasks.filter((task) => {
        return task._id !== taskId;
    });
}


/*
 * Filter state
 */

export function setFilters(newFilters) {
    Object.assign(
        filters,
        newFilters
    );
}


export function getFilters() {
    return {
        ...filters
    };
}