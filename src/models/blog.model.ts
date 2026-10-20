import { Schema, model, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "DRAFT",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export type BlogDocument = InferSchemaType<typeof blogSchema>;

const Blog = model("Blog", blogSchema);

export default Blog;
