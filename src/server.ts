import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();
const PORT = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
