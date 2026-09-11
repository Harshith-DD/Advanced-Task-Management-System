import { Router } from "express";

import {
    createTaskController,
    getAllTasksController,
    getTaskByIdController,
    updateTaskController,
    deleteTaskController,
    assignTaskController
} from "../controllers/task_controller.js";

import {
    authenticateUser
} from "../middleware/auth_middleware.js";

const router = Router();

router.post(
    "/",
    authenticateUser,
    createTaskController
);

router.get(
    "/",
    authenticateUser,
    getAllTasksController
);

router.patch(
    "/:id/assign",
    authenticateUser,
    assignTaskController
);

router.get(
    "/:id",
    authenticateUser,
    getTaskByIdController
);

router.put(
    "/:id",
    authenticateUser,
    updateTaskController
);

router.delete(
    "/:id",
    authenticateUser,
    deleteTaskController
);

export default router;