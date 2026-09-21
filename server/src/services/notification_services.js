import Notification from "../models/notification_model.js";

// ========================================
// NOTIFICATION SERVICE
// ========================================

class NotificationService {
  // ====================================
  // CREATE NOTIFICATION
  // ====================================

  async createNotification(notificationData) {
    return await Notification.create(notificationData);
  }

  // ====================================
  // GET NOTIFICATIONS
  // ====================================

  async getNotifications(userId) {
    return await Notification.find({
      user: userId,
    })
      .populate({
        path: "task",
        select: "title taskKey status priority project",
        populate: {
          path: "project",
          select: "name key",
        },
      })
      .sort({
        createdAt: -1,
      })
      .limit(50);
  }

  // ====================================
  // MARK ONE AS READ
  // ====================================

  async markNotificationAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
      },
      {
        read: true,
      },
      {
        returnDocument: "after",
      },
    );
  }

  // ====================================
  // MARK ALL AS READ
  // ====================================

  async markAllNotificationsAsRead(userId) {
    return await Notification.updateMany(
      {
        user: userId,
        read: false,
      },
      {
        read: true,
      },
    );
  }
}

// ========================================
// SERVICE INSTANCE
// ========================================

const notificationService = new NotificationService();

export default notificationService;
