import Notification from "../models/notification_model.js";


// ========================================
// CREATE NOTIFICATION
// ========================================

export async function createNotification(
    notificationData
) {
    return await Notification.create(
        notificationData
    );
}


// ========================================
// GET NOTIFICATIONS
// ========================================

export async function getNotifications(
    userId
) {
    return await Notification
        .find({
            user: userId
        })
        .populate(
            "task",
            "title status priority"
        )
        .sort({
            createdAt: -1
        });
}


// ========================================
// MARK ONE AS READ
// ========================================

export async function markNotificationAsRead(
    notificationId,
    userId
) {
    return await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            user: userId
        },
        {
            read: true
        },
        {
            new: true
        }
    );
}


// ========================================
// MARK ALL AS READ
// ========================================

export async function markAllNotificationsAsRead(
    userId
) {
    return await Notification.updateMany(
        {
            user: userId,
            read: false
        },
        {
            read: true
        }
    );
}