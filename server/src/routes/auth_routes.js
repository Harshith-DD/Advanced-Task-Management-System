import { Router } from "express";

import {
    registerController,
    loginController,
    getCurrentUserController,
    logoutController
} from "../controllers/auth_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";


const router = Router();


router.post(
    "/register",
    registerController
);


router.post(
    "/login",
    loginController
);


router.get(
    "/me",
    authenticateUser,
    getCurrentUserController
);


router.post(
    "/logout",
    logoutController
);


export default router;