
import type { Request, Response } from "express";
import app from "../src/app.ts";
import connectDB from "../src/config/db.ts";

export default async function handler(
  req: Request,
  res: Response
) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
