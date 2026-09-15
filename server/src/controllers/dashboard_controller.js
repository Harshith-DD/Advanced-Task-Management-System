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
        const dashboard =
            await getDashboard(
                req.user
            );


        res.status(200).json({
            success: true,
            data: dashboard
        });

}