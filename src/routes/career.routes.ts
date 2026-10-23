
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.ts";

import {
   createApplication,
  getApplications,
  getApplicationById,
} from "../controller/career.controller.ts";

const router = Router();

  router.post("/apply", createApplication);                          // public
router.get("/applications", requireAuth, getApplications);
router.get("/applications/:id", requireAuth, getApplicationById);

export default router;

