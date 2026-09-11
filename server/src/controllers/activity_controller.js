import {
    getActivities
} from "../services/activity_services.js";


// ========================================
// GET ACTIVITIES
// ========================================

export async function getActivitiesController(
    req,
    res
) {
    try {
        const activities =
            await getActivities(
                req.user
            );


        res.status(200).json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error(
            "Failed to fetch activities:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch activities"
        });
    }
}