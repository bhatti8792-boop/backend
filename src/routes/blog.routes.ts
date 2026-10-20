import { Router } from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controller/blog.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

// Public routes
router.get("/", getBlogs);
router.get("/:id", getBlogById);

// Authenticated routes
router.post("/", requireAuth, createBlog);
router.patch("/:id", requireAuth, updateBlog);
router.delete("/:id", requireAuth, deleteBlog);

export default router;
