import { Router } from "express";

import { createTaskController } from "../controllers/task_controller.js";

const router = Router();

router.post("/", createTaskController);

export default router;