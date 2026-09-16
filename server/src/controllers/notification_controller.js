import notificationService from "../services/notification_services.js";

import { NotFoundError } from "../errors/app_error.js";
// ========================================
// GET NOTIFICATIONS
// ========================================

export async function getNotificationsController(req, res) {
  const notifications = await notificationService.getNotifications(
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    data: notifications,
  });
}

// ========================================
// MARK ONE AS READ
// ========================================

export async function markNotificationAsReadController(req, res) {
  const notification = await notificationService.markNotificationAsRead(
    req.params.id,
    req.user.userId,
  );

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
}

// ========================================
// MARK ALL AS READ
// ========================================

export async function markAllNotificationsAsReadController(req, res) {
  const result = await notificationService.markAllNotificationsAsRead(
    req.user.userId,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}
