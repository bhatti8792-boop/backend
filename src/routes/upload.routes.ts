import { Router } from "express";
import { uploadFile } from "../controller/upload.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { upload } from "../middleware/upload.middleware.ts";

const router = Router();

router.post("/", requireAuth, upload.single("file"), uploadFile);

export default router;
