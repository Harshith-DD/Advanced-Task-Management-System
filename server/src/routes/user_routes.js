import { Router } from "express";

import {
    getAllUsersController
} from "../controllers/user_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";

const router = Router();

router.get(
    "/",
    authenticateUser,
    getAllUsersController
);

export default router;