import Task from "../models/task_model.js";
import User from "../models/user_model.js";

import taskEvents, {
    TASK_EVENTS
} from "../events/task_events.js";
// ========================================
// CREATE TASK
// ========================================

export async function createTask(taskData, userId) {
    const task = await Task.create(taskData);

    taskEvents.emit(
    TASK_EVENTS.CREATED,
    {
        task,
        userId
    }
);

    return task;
}


// ========================================
// GET ALL TASKS
// ========================================

export async function getAllTasks(
    filters = {},
    user
) {
    const {
        status,
        priority,
        search,
        tag,
        fromDate,
        toDate,
        sortBy = "createdAt",
        sortOrder = "asc",
        page = 1,
        limit = 10
    } = filters;


    // ----------------------------------------
    // BUILD QUERY CONDITIONS
    // ----------------------------------------

    const conditions = [];


    // ----------------------------------------
    // AUTHORIZATION FILTER
    // ----------------------------------------

    /*
     * Admins can see every task.
     *
     * Normal users can only see:
     *
     * 1. Tasks they own
     * OR
     * 2. Tasks assigned to them
     */

    if (user.role !== "admin") {
        conditions.push({
            $or: [
                {
                    owner: user.userId
                },
                {
                    assignedTo: user.userId
                }
            ]
        });
    }


    // ----------------------------------------
    // STATUS FILTER
    // ----------------------------------------

    if (status) {
        conditions.push({
            status
        });
    }


    // ----------------------------------------
    // PRIORITY FILTER
    // ----------------------------------------

    if (priority) {
        conditions.push({
            priority
        });
    }


    // ----------------------------------------
    // SEARCH FILTER
    // ----------------------------------------

    if (search) {
        conditions.push({
            $or: [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        });
    }


    // ----------------------------------------
    // TAG FILTER
    // ----------------------------------------

    if (tag) {
        conditions.push({
            tags: {
                $in: [tag]
            }
        });
    }


    // ----------------------------------------
    // DATE FILTER
    // ----------------------------------------

    if (fromDate || toDate) {
        const dueDateQuery = {};

        if (fromDate) {
            dueDateQuery.$gte =
                new Date(fromDate);
        }

        if (toDate) {
            dueDateQuery.$lte =
                new Date(toDate);
        }

        conditions.push({
            dueDate: dueDateQuery
        });
    }


    // ----------------------------------------
    // FINAL QUERY
    // ----------------------------------------

    const query =
        conditions.length > 0
            ? { $and: conditions }
            : {};


    // ----------------------------------------
    // SORTING
    // ----------------------------------------

    const allowedSortFields = [
        "dueDate",
        "priority",
        "createdAt",
        "updatedAt"
    ];

    const safeSortBy =
        allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

    const safeSortOrder =
        sortOrder === "desc"
            ? -1
            : 1;

    const sort = {
        [safeSortBy]: safeSortOrder
    };


    // ----------------------------------------
    // PAGINATION
    // ----------------------------------------

    const pageNumber =
        Math.max(
            Number(page) || 1,
            1
        );

    const pageLimit =
        Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            100
        );

    const skip =
        (pageNumber - 1) *
        pageLimit;


    // ----------------------------------------
    // DATABASE QUERIES
    // ----------------------------------------

    const totalTasks =
        await Task.countDocuments(query);

    const tasks =
        await Task
            .find(query)
            .populate(
                "owner",
                "name email"
            )
            .populate(
                "assignedTo",
                "name email"
            )
            .sort(sort)
            .skip(skip)
            .limit(pageLimit);


    // ----------------------------------------
    // PAGINATION METADATA
    // ----------------------------------------

    const totalPages =
        Math.ceil(
            totalTasks / pageLimit
        );


    return {
        tasks,

        pagination: {
            page: pageNumber,
            limit: pageLimit,
            totalTasks,
            totalPages
        }
    };
}


// ========================================
// GET ONE TASK
// ========================================

export async function getTaskById(
    taskId
) {
    return await Task
        .findById(taskId)
        .populate(
            "owner",
            "name email"
        )
        .populate(
            "assignedTo",
            "name email"
        );
}


// ========================================
// UPDATE TASK
// ========================================

export async function updateTask(
    taskId,
    taskData,
    userId
) {
    // ----------------------------------------
    // GET CURRENT TASK
    // ----------------------------------------

    const existingTask =
        await Task.findById(taskId);

    if (!existingTask) {
        return null;
    }


    // ----------------------------------------
    // UPDATE TASK
    // ----------------------------------------

    const updatedTask =
        await Task.findByIdAndUpdate(
            taskId,
            taskData,
            {
                new: true,
                runValidators: true
            }
        )
            .populate(
                "owner",
                "name email"
            )
            .populate(
                "assignedTo",
                "name email"
            );


    // ----------------------------------------
    // TASK UPDATED EVENT
    // ----------------------------------------

    taskEvents.emit(
    TASK_EVENTS.UPDATED,
    {
        task: updatedTask,
        userId
    }
);


    // ----------------------------------------
    // TASK COMPLETED EVENT
    // ----------------------------------------

    const wasCompleted =
        existingTask.status === "completed";

    const isCompleted =
        updatedTask.status === "completed";


    if (
        !wasCompleted &&
        isCompleted
    ) {
        taskEvents.emit(
    TASK_EVENTS.COMPLETED,
    {
        task: updatedTask,
        userId
    }
);
    }


    return updatedTask;
}


// ========================================
// DELETE TASK
// ========================================

export async function deleteTask(
    taskId
) {
    return await Task.findByIdAndDelete(
        taskId
    );
}

export async function assignTask(
    taskId,
    assignedTo,
    userId
) {
    const task =
        await Task.findById(taskId);

    if (!task) {
        return null;
    }


    // ----------------------------------------
    // REMOVE ASSIGNMENT
    // ----------------------------------------

    if (!assignedTo) {
        task.assignedTo = null;

        await task.save();

        const updatedTask =
            await Task
                .findById(taskId)
                .populate(
                    "owner",
                    "name email role"
                )
                .populate(
                    "assignedTo",
                    "name email role"
                );

        taskEvents.emit(
    TASK_EVENTS.ASSIGNED,
    {
        task: updatedTask,
        userId
    }
);

        return updatedTask;
    }


    // ----------------------------------------
    // VERIFY ASSIGNED USER
    // ----------------------------------------

    const user =
        await User.findById(assignedTo);

    if (!user) {
        throw new Error(
            "Assigned user not found"
        );
    }


    // ----------------------------------------
    // ASSIGN TASK
    // ----------------------------------------

    task.assignedTo = assignedTo;

    await task.save();


    // ----------------------------------------
    // GET POPULATED TASK
    // ----------------------------------------

    const updatedTask =
        await Task
            .findById(taskId)
            .populate(
                "owner",
                "name email role"
            )
            .populate(
                "assignedTo",
                "name email role"
            );


    // ----------------------------------------
    // TASK ASSIGNED EVENT
    // ----------------------------------------

    taskEvents.emit(
    TASK_EVENTS.ASSIGNED,
    {
        task: updatedTask,
        userId
    }
);


    return updatedTask;
}