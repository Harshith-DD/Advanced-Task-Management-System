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


    // ====================================
    // STATUS SELECT
    // ====================================

    if (canEdit) {
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


        footer.append(statusSelect);
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

            /*
             * Do not allow assigning a task
             * to its current owner.
             */

            if (
                task.owner?._id?.toString() ===
                user._id?.toString()
            ) {
                continue;
            }


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