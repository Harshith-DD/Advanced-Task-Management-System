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
        sortOrder = "asc",
        page = 1,
        limit = 10
    } = filters;

    const query = {};

    // -------------------------
    // Filtering
    // -------------------------

    if (status) {
        query.status = status;
    }

    if (priority) {
        query.priority = priority;
    }

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

    if (tag) {
        query.tags = {
            $in: [tag]
        };
    }

    if (fromDate || toDate) {
        query.dueDate = {};

        if (fromDate) {
            query.dueDate.$gte = new Date(fromDate);
        }

        if (toDate) {
            query.dueDate.$lte = new Date(toDate);
        }
    }

    // -------------------------
    // Sorting
    // -------------------------

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

    // -------------------------
    // Pagination
    // -------------------------

    const pageNumber = Math.max(
        Number(page) || 1,
        1
    );

    const pageLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );

    const skip = (pageNumber - 1) * pageLimit;

    // Count matching documents
    const totalTasks =
        await Task.countDocuments(query);

    // Fetch only the current page
    const tasks =
        await Task
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(pageLimit);

    const totalPages =
        Math.ceil(totalTasks / pageLimit);

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