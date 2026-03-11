import mongoose from "mongoose";

let cachedConnectionPromise;

const connectWithUri = async (uri) => {
  cachedConnectionPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 5,
  });

  try {
    await cachedConnectionPromise;
    console.log("MongoDB connected");
    return mongoose.connection;
  } catch (error) {
    cachedConnectionPromise = undefined;
    throw error;
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const localFallbackUri =
    process.env.MONGO_LOCAL_URI || "mongodb://127.0.0.1:27017/courierflow";

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  try {
    return await connectWithUri(mongoUri);
  } catch (primaryError) {
    const isLocalPrimary =
      mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost");
    if (isLocalPrimary || localFallbackUri === mongoUri) {
      throw primaryError;
    }

    console.error(
      "Primary MongoDB connection failed. Falling back to local MongoDB.",
      primaryError.message,
    );
    return connectWithUri(localFallbackUri);
  }
};
