import Notification from "../models/notification_model.js";


// ========================================
// NOTIFICATION SERVICE
// ========================================

class NotificationService {

    // ====================================
    // CREATE NOTIFICATION
    // ====================================

    async createNotification(
        notificationData
    ) {
        return await Notification.create(
            notificationData
        );
    }


    // ====================================
    // GET NOTIFICATIONS
    // ====================================

    async getNotifications(
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


    // ====================================
    // MARK ONE AS READ
    // ====================================

    async markNotificationAsRead(
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


    // ====================================
    // MARK ALL AS READ
    // ====================================

    async markAllNotificationsAsRead(
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
}


// ========================================
// SERVICE INSTANCE
// ========================================

const notificationService =
    new NotificationService();

export default notificationService;