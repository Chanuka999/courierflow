import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Vercel function startup failed", error);
    return res.status(500).json({
      message: "Server failed to start",
      error: error.message,
    });
  }
}
