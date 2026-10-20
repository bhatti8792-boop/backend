import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI?.trim();

    if (!uri) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error(
        `Invalid MongoDB URI scheme. Received: ${uri.split(":")[0]}`,
      );
    }

    const connection = await mongoose.connect(uri);

    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`,
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
