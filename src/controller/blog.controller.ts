import type { RequestHandler } from "express";
import { z } from "zod";
import Blog from "../models/blog.model.ts";
import User from "../models/user.ts";
import {
  createBlogSchema,
  updateBlogSchema,
  blogIdSchema,
  blogQuerySchema,
} from "../validation/blog.validation.ts";

const makeSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base}-${Date.now()}`;
};

export const createBlog: RequestHandler = async (req, res, next) => {
  try {
    const parsed = createBlogSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.treeifyError(parsed.error),
      });
      return;
    }

    const userId = res.locals.auth?.userId as string | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      res.status(401).json({
        success: false,
        message: "User account not found",
      });
      return;
    }

    const { title, ...fields } = parsed.data;
    const status = fields.status ?? "DRAFT";

    const blog = await Blog.create({
      ...fields,
      title,
      slug: makeSlug(title),
      author: userId,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogs: RequestHandler = async (req, res, next) => {
  try {
    const parsed = blogQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: z.treeifyError(parsed.error),
      });
      return;
    }

    const { page, limit, status } = parsed.data;

    // Public requests can only retrieve published blogs.
    const filter: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    // Do not allow query parameters to expose drafts.
    void status;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", "fullName")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBlogById: RequestHandler = async (req, res, next) => {
  try {
    const parsed = blogIdSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
      return;
    }

    const blog = await Blog.findOne({
      _id: parsed.data.id,
      status: "PUBLISHED",
    }).populate("author", "fullName");

    if (!blog) {
      res.status(404).json({
        success: false,
        message: "Published blog not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBlog: RequestHandler = async (req, res, next) => {
  try {
    const idResult = blogIdSchema.safeParse(req.params);
    const bodyResult = updateBlogSchema.safeParse(req.body);

    if (!idResult.success) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID",
        errors: z.treeifyError(idResult.error),
      });
      return;
    }

    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: z.treeifyError(bodyResult.error),
      });
      return;
    }

    const userId = res.locals.auth?.userId as string | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const blog = await Blog.findOne({
      _id: idResult.data.id,
      author: userId,
    });

    if (!blog) {
      res.status(404).json({
        success: false,
        message: "Blog not found or you are not its author",
      });
      return;
    }

    const updates = bodyResult.data;

    if (updates.title !== undefined) {
      blog.title = updates.title;
      blog.slug = makeSlug(updates.title);
    }

    if (updates.excerpt !== undefined) {
      blog.excerpt = updates.excerpt;
    }

    if (updates.content !== undefined) {
      blog.content = updates.content;
    }

    if (updates.coverImage !== undefined) {
      blog.coverImage = updates.coverImage;
    }

    if (updates.tags !== undefined) {
      blog.tags = updates.tags;
    }

    if (updates.status !== undefined) {
      blog.status = updates.status;
      blog.publishedAt =
        updates.status === "PUBLISHED"
          ? (blog.publishedAt ?? new Date())
          : null;
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBlog: RequestHandler = async (req, res, next) => {
  try {
    const parsed = blogIdSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
      return;
    }

    const userId = res.locals.auth?.userId as string | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const blog = await Blog.findOneAndDelete({
      _id: parsed.data.id,
      author: userId,
    });

    if (!blog) {
      res.status(404).json({
        success: false,
        message: "Blog not found or you are not its author",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
