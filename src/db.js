import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/menumap";

export async function connectDB(logger = console) {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB successfully");
  } catch (error) {
    logger.error({ error }, "MongoDB connection error");
    process.exit(1);
  }
}
