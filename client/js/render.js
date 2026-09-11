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


export function renderTasks(
    tasks,
    users = [],
    currentUser = null
) {
    taskListElement.innerHTML = "";

    updateStatistics(tasks);
    updateVisibleCount(tasks);

    if (tasks.length === 0) {
        emptyStateElement.hidden = false;
        return;
    }

    emptyStateElement.hidden = true;

    for (const task of tasks) {
        const taskCard =
            createTaskCard(
                task,
                users,
                currentUser
            );

        taskListElement.append(taskCard);
    }
}


// ========================================
// STATISTICS
// ========================================

function updateStatistics(tasks) {
    const completedTasks =
        tasks.filter(
            (task) =>
                task.status === "completed"
        );

    const pendingTasks =
        tasks.filter(
            (task) =>
                task.status === "pending"
        );

    totalCountElement.textContent =
        tasks.length;

    completedCountElement.textContent =
        completedTasks.length;

    pendingCountElement.textContent =
        pendingTasks.length;
}


// ========================================
// VISIBLE COUNT
// ========================================

function updateVisibleCount(tasks) {
    const count = tasks.length;

    visibleCountElement.textContent =
        `${count} ${count === 1 ? "task" : "tasks"}`;
}


// ========================================
// CREATE TASK CARD
// ========================================

function createTaskCard(
    task,
    users,
    currentUser
) {
    const article =
        document.createElement("article");

    article.className =
        `task-card priority-${task.priority}`;


    // ====================================
    // HEADER
    // ====================================

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


    header.append(
        title,
        priority
    );


    // ====================================
    // DESCRIPTION
    // ====================================

    const description =
        document.createElement("p");

    description.className =
        "task-description";

    description.textContent =
        task.description || "";


    // ====================================
    // OWNERSHIP
    // ====================================

    const ownership =
        document.createElement("div");

    ownership.className =
        "task-ownership";


    const ownerName =
        task.owner?.name ||
        "Unknown";


    const assignedName =
        task.assignedTo?.name ||
        "Unassigned";


    const ownerElement =
        document.createElement("span");

    ownerElement.textContent =
        `Owner: ${ownerName}`;


    const assignedElement =
        document.createElement("span");

    assignedElement.textContent =
        `Assigned to: ${assignedName}`;


    ownership.append(
        ownerElement,
        assignedElement
    );


    // ====================================
    // METADATA
    // ====================================

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


    metadata.append(
        dueDate,
        createdAt,
        updatedAt
    );


    // ====================================
    // TAGS
    // ====================================

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


    // ====================================
    // FOOTER
    // ====================================

    const footer =
        document.createElement("div");

    footer.className =
        "task-card-footer";


    // ====================================
    // PERMISSIONS
    // ====================================

    const isAdmin =
        currentUser?.role === "admin";


    const currentUserId =
        currentUser?.id?.toString();


    const ownerId =
        task.owner?._id?.toString();


    const assignedUserId =
        task.assignedTo?._id?.toString();


    const isOwner =
        currentUserId &&
        ownerId &&
        currentUserId === ownerId;


    const isAssignedUser =
        currentUserId &&
        assignedUserId &&
        currentUserId === assignedUserId;


    /*
     * Users who can edit:
     *
     * - Admin
     * - Owner
     * - Assigned user
     */

    const canEdit =
        isAdmin ||
        isOwner ||
        isAssignedUser;


    /*
     * Users who can delete:
     *
     * - Admin
     * - Owner
     */

    const canDelete =
        isAdmin ||
        isOwner;


    /*
     * Users who can assign:
     *
     * - Admin
     * - Owner
     */

    const canAssign =
        isAdmin ||
        isOwner;


if (canEdit) {
    // ====================================
    // STATUS SELECT
    // ====================================

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

    for (
        const [value, label]
        of statuses
    ) {
        const option =
            document.createElement("option");

        option.value =
            value;

        option.textContent =
            label;

        if (task.status === value) {
            option.selected = true;
        }

        statusSelect.append(option);
    }


    // ====================================
    // PRIORITY SELECT
    // ====================================

    const prioritySelect =
        document.createElement("select");

    prioritySelect.className =
        "priority-select";

    prioritySelect.dataset.taskId =
        task._id;

    const priorities = [
        ["low", "Low"],
        ["medium", "Medium"],
        ["high", "High"]
    ];

    for (
        const [value, label]
        of priorities
    ) {
        const option =
            document.createElement("option");

        option.value =
            value;

        option.textContent =
            `Priority: ${label}`;

        if (task.priority === value) {
            option.selected = true;
        }

        prioritySelect.append(option);
    }


    // ====================================
    // ADD CONTROLS
    // ====================================

    footer.append(
        statusSelect,
        prioritySelect
    );
}


    // ====================================
    // ACTIONS
    // ====================================

    const actions =
        document.createElement("div");

    actions.className =
        "task-actions";


    // ====================================
    // ASSIGNMENT
    // ====================================

    if (canAssign) {
        const assignmentSelect =
            document.createElement("select");

        assignmentSelect.className =
            "assignment-select";

        assignmentSelect.dataset.taskId =
            task._id;


        /*
         * First option allows the owner/admin
         * to remove the assignment.
         */

        const unassignedOption =
            document.createElement("option");

        unassignedOption.value = "";

        unassignedOption.textContent =
            "Unassigned";


        if (!task.assignedTo) {
            unassignedOption.selected =
                true;
        }


        assignmentSelect.append(
            unassignedOption
        );


        // -------------------------------
        // USER OPTIONS
        // -------------------------------

        for (const user of users) {

            const option =
                document.createElement("option");

            option.value =
                user._id;

            option.textContent =
                user.name;


            if (
                task.assignedTo?._id?.toString() ===
                user._id?.toString()
            ) {
                option.selected = true;
            }


            assignmentSelect.append(option);
        }


        actions.append(
            assignmentSelect
        );
    }


    // ====================================
    // DELETE BUTTON
    // ====================================

    if (canDelete) {
        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "delete-button";

        deleteButton.dataset.taskId =
            task._id;

        deleteButton.textContent =
            "Delete";


        actions.append(
            deleteButton
        );
    }


    // ====================================
    // ADD ACTIONS
    // ====================================

    if (actions.children.length > 0) {
        footer.append(actions);
    }


    // ====================================
    // FINAL CARD
    // ====================================

    article.append(
        header,
        description,
        ownership,
        metadata,
        tags,
        footer
    );


    return article;
}


// ========================================
// FORMAT DATE
// ========================================

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "Not set";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Invalid date";
    }


    return date.toLocaleString();
}

export function renderActivities(activities) {
    const activityList =
        document.getElementById("activity-list");

    if (!activityList) {
        return;
    }

    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <p class="activity-empty">
                No activity yet.
            </p>
        `;

        return;
    }

    activityList.innerHTML = activities
        .map((activity) => {
            const date =
                new Date(
                    activity.createdAt
                ).toLocaleString();

            return `
                <div class="activity-item">
                    <div class="activity-content">
                        <p class="activity-message">
                            ${activity.message}
                        </p>

                        <div class="activity-meta">
                            <span>
                                ${activity.user?.name ?? "Unknown user"}
                            </span>

                            <span>
                                ${date}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");
}

export function renderNotifications(
    notifications
) {
    const notificationList =
        document.getElementById(
            "notification-list"
        );

    const unreadCountElement =
        document.getElementById(
            "unread-notification-count"
        );

    if (!notificationList) {
        return;
    }

    if (
        !notifications ||
        notifications.length === 0
    ) {
        notificationList.innerHTML = `
            <p class="notification-empty">
                No notifications yet.
            </p>
        `;

        if (unreadCountElement) {
            unreadCountElement.textContent = "0";
        }

        return;
    }

    const unreadCount =
        notifications.filter(
            (notification) =>
                !notification.read
        ).length;

    if (unreadCountElement) {
        unreadCountElement.textContent =
            unreadCount;
    }

    notificationList.innerHTML = "";

    for (
        const notification
        of notifications
    ) {
        const notificationItem =
            document.createElement("article");

        notificationItem.className =
            notification.read
                ? "notification-item"
                : "notification-item unread";

        const content =
            document.createElement("div");

        content.className =
            "notification-content";

        const message =
            document.createElement("p");

        message.className =
            "notification-message";

        message.textContent =
            notification.message;

        const meta =
            document.createElement("div");

        meta.className =
            "notification-meta";

        const taskTitle =
            document.createElement("span");

        taskTitle.textContent =
            `Task: ${
                notification.task?.title ??
                "Unknown task"
            }`;

        const date =
            document.createElement("span");

        date.textContent =
            new Date(
                notification.createdAt
            ).toLocaleString();

        meta.append(
            taskTitle,
            date
        );

        content.append(
            message,
            meta
        );

        notificationItem.append(
            content
        );

        if (!notification.read) {
            const readButton =
                document.createElement("button");

            readButton.type =
                "button";

            readButton.className =
                "mark-read-button";

            readButton.dataset.notificationId =
                notification._id;

            readButton.textContent =
                "Mark as read";

            notificationItem.append(
                readButton
            );
        }

        notificationList.append(
            notificationItem
        );
    }
}