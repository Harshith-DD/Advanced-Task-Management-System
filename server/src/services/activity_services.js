import Activity from "../models/activity_model.js";


// ========================================
// CREATE ACTIVITY
// ========================================

export async function createActivity(
    activityData
) {
    return await Activity.create(
        activityData
    );
}


// ========================================
// GET ACTIVITIES
// ========================================

export async function getActivities(
    user
) {
    const query =
        user.role === "admin"
            ? {}
            : {
                user: user.userId
            };

    return await Activity
        .find(query)
        .populate(
            "user",
            "name email"
        )
        .populate(
            "task",
            "title status priority"
        )
        .sort({
            createdAt: -1
        });
}