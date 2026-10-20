
import dotenv from "dotenv";
import app from "../src/app.js";
import connectDB from "../src/config/db.js";

dotenv.config();

let connectionPromise: Promise<unknown> | null = null;

export default async function handler(
  req: Parameters<typeof app>[0],
  res: Parameters<typeof app>[1]
) {
  try {
    if (!connectionPromise) {
      connectionPromise = connectDB().catch((error) => {
        connectionPromise = null;
        throw error;
      });
    }

    await connectionPromise;

    return app(req, res);
  } catch (error) {
    console.error("Database connection error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
