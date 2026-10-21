
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Fiscora API is running"
  });
});

// Add your existing routes here
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);

export default app;
