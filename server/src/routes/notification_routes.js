import { Router } from "express";

import {
    getNotificationsController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController
} from "../controllers/notification_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";

import {
    asyncHandler
} from "../utils/async_handler.js";

const router = Router();


// ========================================
// GET ALL NOTIFICATIONS
// ========================================

router.get(
    "/",
    authenticateUser,
    asyncHandler(
    getNotificationsController)
);


// ========================================
// MARK ALL AS READ
// ========================================

router.patch(
    "/read-all",
    authenticateUser,
    asyncHandler(
    markAllNotificationsAsReadController)
);


// ========================================
// MARK ONE AS READ
// ========================================

router.patch(
    "/:id/read",
    authenticateUser,
    asyncHandler(
    markNotificationAsReadController)
);


export default router;