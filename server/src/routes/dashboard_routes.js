import { Router } from "express";

import {
    getDashboardController
} from "../controllers/dashboard_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";


const router = Router();


router.get(
    "/",
    authenticateUser,
    getDashboardController
);


export default router;