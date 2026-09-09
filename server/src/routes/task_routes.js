import { Router } from "express";

import { createTaskController,
    getAllTasksController
 } from "../controllers/task_controller.js";

const router = Router();

router.post("/", createTaskController);
router.get("/",getAllTasksController);

export default router;