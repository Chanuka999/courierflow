import mongoose from "mongoose";

let cachedConnectionPromise;

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  cachedConnectionPromise = mongoose.connect(mongoUri);
  await cachedConnectionPromise;
  console.log("MongoDB connected");
  return mongoose.connection;
};
