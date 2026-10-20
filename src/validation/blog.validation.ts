import { z } from "zod";

const blogFields = {
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20),
  coverImage: z.union([z.string().url(), z.literal("")]).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
};

export const createBlogSchema = z
  .object({
    ...blogFields,
  })
  .strict();

export const updateBlogSchema = z
  .object({
    title: blogFields.title.optional(),
    excerpt: blogFields.excerpt.optional(),
    content: blogFields.content.optional(),
    coverImage: blogFields.coverImage,
    tags: blogFields.tags,
    status: blogFields.status,
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export const blogIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid blog ID"),
});

export const blogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
