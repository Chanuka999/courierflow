import mongoose from "mongoose";
import { PARCEL_STATUSES } from "./Parcel.js";

const statusLogSchema = new mongoose.Schema(
  {
    parcel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
      index: true,
    },
    status: { type: String, enum: PARCEL_STATUSES, required: true },
    note: { type: String, trim: true },
    location: { type: String, trim: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const StatusLog = mongoose.model("StatusLog", statusLogSchema);
