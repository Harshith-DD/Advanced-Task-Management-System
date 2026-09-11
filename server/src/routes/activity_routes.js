import { Router } from "express";

import {
    getActivitiesController
} from "../controllers/activity_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";


const router = Router();


router.get(
    "/",
    authenticateUser,
    getActivitiesController
);


export default router;