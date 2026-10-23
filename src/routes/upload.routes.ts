import { Router } from "express";
import { uploadFile } from "../controller/upload.controller.ts";
import { upload } from "../middleware/upload.middleware.ts";

const router = Router();

router.post("/", upload.single("file"), uploadFile);

export default router;
