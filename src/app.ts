import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

import type { ErrorRequestHandler } from "express";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import jobRoutes from "./routes/career.routes.js";
import blogsRoutes from "./routes/blog.routes.js";

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://fiscora-six.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// MIDDLEWARE
app.use(express.json());
app.use(cookieParser());

// HEALTH CHECK (no DB needed)
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Fiscora API is running",
  });
});

// DB CONNECTION (runs before all API routes)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// API ROUTES
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/contact", contactRoutes);
apiRouter.use("/jobs", jobRoutes);
apiRouter.use("/upload", uploadRoutes);
apiRouter.use("/blogs", blogsRoutes);

app.use("/api", apiRouter); // /api/auth/login
app.use("/", apiRouter); // /auth/login

// 404 HANDLER
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// GLOBAL ERROR HANDLER
const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  console.error("========== BACKEND ERROR ==========");
  console.error("METHOD:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("ERROR:", err);
  console.error("===================================");

  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  let message = "Internal server error";
  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === "object" && err !== null && "message" in err) {
    message = String((err as { message: unknown }).message);
  }

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