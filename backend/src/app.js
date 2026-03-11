import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import branchManagerRoutes from "./routes/branchManagerRoutes.js";
import parcelRoutes from "./routes/parcelRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();
const uploadsBasePath =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "uploads")
    : path.resolve("src", "uploads");

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsBasePath));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "CourierFlow backend is running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "CourierFlow backend is healthy" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "CourierFlow API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/branch-manager", branchManagerRoutes);
app.use("/api/parcels", parcelRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
