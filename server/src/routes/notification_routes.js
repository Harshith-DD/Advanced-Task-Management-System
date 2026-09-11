import { Router } from "express";

import {
    getNotificationsController,
    markNotificationAsReadController,
    markAllNotificationsAsReadController
} from "../controllers/notification_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";


const router = Router();


// ========================================
// GET ALL NOTIFICATIONS
// ========================================

router.get(
    "/",
    authenticateUser,
    getNotificationsController
);


// ========================================
// MARK ALL AS READ
// ========================================

router.patch(
    "/read-all",
    authenticateUser,
    markAllNotificationsAsReadController
);


// ========================================
// MARK ONE AS READ
// ========================================

router.patch(
    "/:id/read",
    authenticateUser,
    markNotificationAsReadController
);


export default router;