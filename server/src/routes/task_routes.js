import { Router } from "express";

import { createTaskController,
    getAllTasksController,
    getTaskByIdController
 } from "../controllers/task_controller.js";

const router = Router();

router.post("/", createTaskController);
router.get("/",getAllTasksController);
router.get("/:id", getTaskByIdController);

export default router;