import { Router } from "express";

import { createTaskController,
    getAllTasksController,
    getTaskByIdController,
    updateTaskController
 } from "../controllers/task_controller.js";

const router = Router();

router.post("/", createTaskController);
router.get("/",getAllTasksController);
router.get("/:id", getTaskByIdController);
router.put("/:id", updateTaskController);

export default router;