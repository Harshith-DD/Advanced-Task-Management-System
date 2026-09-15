import { Router } from "express";

import {
    getAllUsersController
} from "../controllers/user_controller.js";

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
    getAllUsersController)
);

export default router;