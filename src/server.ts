import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");

console.log("Looking for .env at:", envPath);
console.log("File exists:", fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
console.log("dotenv error:", result.error?.message ?? "none");
console.log("Variables loaded:", Object.keys(result.parsed ?? {}));

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();