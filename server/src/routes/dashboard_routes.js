import { Router } from "express";

import {
    getDashboardController
} from "../controllers/dashboard_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";

import {
    asyncHandler
} from "../utils/async_handler.js";

const router = Router();


router.get(
    "/",
    authenticateUser,
    asyncHandler(
    getDashboardController)
);


export default router;