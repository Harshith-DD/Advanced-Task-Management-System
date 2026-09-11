import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../services/notification_services.js";


// ========================================
// GET NOTIFICATIONS
// ========================================

export async function getNotificationsController(
    req,
    res
) {
    try {
        const notifications =
            await getNotifications(
                req.user.userId
            );

        res.status(200).json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error(
            "Failed to fetch notifications:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch notifications"
        });
    }
}


// ========================================
// MARK ONE AS READ
// ========================================

export async function markNotificationAsReadController(
    req,
    res
) {
    try {
        const notification =
            await markNotificationAsRead(
                req.params.id,
                req.user.userId
            );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error(
            "Failed to mark notification as read:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to mark notification as read"
        });
    }
}


// ========================================
// MARK ALL AS READ
// ========================================

export async function markAllNotificationsAsReadController(
    req,
    res
) {
    try {
        const result =
            await markAllNotificationsAsRead(
                req.user.userId
            );

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(
            "Failed to mark notifications as read:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to mark notifications as read"
        });
    }
}