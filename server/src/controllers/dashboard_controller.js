import {
    getDashboard
} from "../services/dashboard_services.js";


// ========================================
// GET DASHBOARD
// ========================================

export async function getDashboardController(
    req,
    res
) {
    try {

        const dashboard =
            await getDashboard(
                req.user
            );


        res.status(200).json({
            success: true,
            data: dashboard
        });

    } catch (error) {

        console.error(
            "Failed to fetch dashboard:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch dashboard"
        });
    }
}