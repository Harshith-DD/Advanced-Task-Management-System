const taskListElement =
    document.querySelector("#task-list");

const emptyStateElement =
    document.querySelector("#empty-state");

const totalCountElement =
    document.querySelector("#total-count");

const completedCountElement =
    document.querySelector("#completed-count");

const pendingCountElement =
    document.querySelector("#pending-count");

const visibleCountElement =
    document.querySelector("#visible-count");


export function renderTasks(tasks) {
    taskListElement.innerHTML = "";

    updateStatistics(tasks);
    updateVisibleCount(tasks);

    if (tasks.length === 0) {
        emptyStateElement.hidden = false;
        return;
    }

    emptyStateElement.hidden = true;

    for (const task of tasks) {
        const taskCard = createTaskCard(task);

        taskListElement.append(taskCard);
    }
}


function updateStatistics(tasks) {
    const completedTasks = tasks.filter(
        (task) => task.status === "completed"
    );

    const pendingTasks = tasks.filter(
        (task) => task.status === "pending"
    );

    totalCountElement.textContent =
        tasks.length;

    completedCountElement.textContent =
        completedTasks.length;

    pendingCountElement.textContent =
        pendingTasks.length;
}


function updateVisibleCount(tasks) {
    const count = tasks.length;

    visibleCountElement.textContent =
        `${count} ${count === 1 ? "task" : "tasks"}`;
}


function createTaskCard(task) {
    const article =
        document.createElement("article");

    article.className =
        `task-card priority-${task.priority}`;

    const header =
        document.createElement("div");

    header.className =
        "task-card-header";

    const title =
        document.createElement("h3");

    title.textContent =
        task.title;

    const priority =
        document.createElement("span");

    priority.className =
        "priority-badge";

    priority.textContent =
        `Priority: ${task.priority}`;

    header.append(title, priority);


    const description =
        document.createElement("p");

    description.className =
        "task-description";

    description.textContent =
        task.description || "";


    const metadata =
        document.createElement("div");

    metadata.className =
        "task-metadata";


    const dueDate =
        document.createElement("span");

    dueDate.textContent =
        `Due: ${formatDateTime(task.dueDate)}`;


const createdAt =
    document.createElement("span");

createdAt.textContent =
    `Created: ${formatDateTime(task.createdAt)}`;


const updatedAt =
    document.createElement("span");

updatedAt.textContent =
    `Updated: ${formatDateTime(task.updatedAt)}`;


    const tags =
        document.createElement("div");

    tags.className =
        "task-tags";

    for (const tag of task.tags || []) {
        const tagElement =
            document.createElement("span");

        tagElement.className =
            "tag";

        tagElement.textContent =
            tag;

        tags.append(tagElement);
    }


    metadata.append(
    dueDate,
    createdAt,
    updatedAt
);


    const footer =
        document.createElement("div");

    footer.className =
        "task-card-footer";


    const statusSelect =
        document.createElement("select");

    statusSelect.className =
        "status-select";

    statusSelect.dataset.taskId =
        task._id;

    const statuses = [
        ["pending", "Pending"],
        ["in-progress", "In Progress"],
        ["completed", "Completed"]
    ];

    for (const [value, label] of statuses) {
        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = label;

        if (task.status === value) {
            option.selected = true;
        }

        statusSelect.append(option);
    }


    const actions =
        document.createElement("div");

    actions.className =
        "task-actions";


    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";

    deleteButton.className =
        "delete-button";

    deleteButton.dataset.taskId =
        task._id;

    deleteButton.textContent =
        "Delete";


    actions.append(deleteButton);

    footer.append(statusSelect, actions);


    article.append(
        header,
        description,
        metadata,
        tags,
        footer
    );

    return article;
}


// function formatDate(dateValue) {
//     if (!dateValue) {
//         return "Not set";
//     }

//     const date =
//         new Date(dateValue);

//     if (Number.isNaN(date.getTime())) {
//         return "Invalid date";
//     }

//     return date.toLocaleDateString();
// }

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "Not set";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }


    return date.toLocaleString();
}