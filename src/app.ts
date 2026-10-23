
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

import type { ErrorRequestHandler } from "express";

import authRoutes from "./routes/auth.routes";
import contactRoutes from "./routes/contact.routes";
import uploadRoutes from "./routes/upload.routes";
import jobRoutes from "./routes/career.routes";
import blogsRoutes from "./routes/blog.routes"

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// MIDDLEWARE
app.use(express.json());
app.use(cookieParser());

// HEALTH CHECK
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Fiscora API is running",
  });
});

// API ROUTES
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);
app.use("/jobs", jobRoutes);
app.use("/upload", uploadRoutes);
app.use("/blogs", blogsRoutes);

// 404 HANDLER
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// GLOBAL ERROR HANDLER
const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  next
) => {
  console.error("========== BACKEND ERROR ==========");
  console.error("METHOD:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("ERROR:", err);
  console.error("===================================");

  if (res.headersSent) {
    next(err);
    return;
  }

  // MULTER ERROR
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // EXTRACT ERROR MESSAGE
  let message = "Internal server error";

  if (err instanceof Error) {
    message = err.message;
  } else if (
    typeof err === "object" &&
    err !== null &&
    "message" in err
  ) {
    message = String(err.message);
  }

  // JSON ERROR RESPONSE
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : message,
  });
};

app.use(errorHandler);

export default app;
