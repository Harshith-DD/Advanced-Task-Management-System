import Task from "../models/task_model.js";

export async function createTask(taskData) {
    const task=await Task.create(taskData);
    return task;
}
export async function getAllTasks(filters = {}) {

    const {
        status,
        priority,
        search,
        tag,
        fromDate,
        toDate,
        sortBy = "createdAt",
        sortOrder = "asc"
    } = filters;


    // ========================================================
    // BUILD MONGODB QUERY
    // ========================================================

    const query = {};


    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    if (status) {

        query.status =
            status;
    }


    // --------------------------------------------------------
    // PRIORITY FILTER
    // --------------------------------------------------------

    if (priority) {

        query.priority =
            priority;
    }


    // --------------------------------------------------------
    // SEARCH TITLE / DESCRIPTION
    // --------------------------------------------------------

    if (search) {

        query.$or = [

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

        ];
    }


    // --------------------------------------------------------
    // TAG FILTER
    // --------------------------------------------------------

    if (tag) {

        query.tags = {
            $in: [tag]
        };
    }


    // --------------------------------------------------------
    // DATE RANGE
    // --------------------------------------------------------

    if (fromDate || toDate) {

        query.dueDate = {};


        if (fromDate) {

            query.dueDate.$gte =
                new Date(fromDate);
        }


        if (toDate) {

            query.dueDate.$lte =
                new Date(toDate);
        }
    }


    // ========================================================
    // SORT
    // ========================================================

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


    // ========================================================
    // DATABASE QUERY
    // ========================================================

    const tasks =
        await Task
            .find(query)
            .sort(sort);


    return tasks;
}

export async function getTaskById(taskId) {
    const task = await Task.findById(taskId);

    return task;
}
export async function updateTask(taskId, taskData) {
    const task = await Task.findByIdAndUpdate(
        taskId,
        taskData,
        {
            new: true,
            runValidators: true
        }
    );

    return task;
}

export async function deleteTask(taskId) {
    const task = await Task.findByIdAndDelete(taskId);

    return task;
}