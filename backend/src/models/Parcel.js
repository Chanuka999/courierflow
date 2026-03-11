import mongoose from "mongoose";

export const PARCEL_STATUSES = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
];

const parcelSchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    senderName: { type: String, required: true, trim: true },
    senderPhone: { type: String, required: true, trim: true },
    senderEmail: { type: String, lowercase: true, trim: true },
    receiverName: { type: String, required: true, trim: true },
    receiverPhone: { type: String, required: true, trim: true },
    receiverEmail: { type: String, lowercase: true, trim: true },
    receiverAddress: { type: String, required: true, trim: true },
    weightKg: { type: Number, min: 0, default: 0 },
    codAmount: { type: Number, min: 0, default: 0 },
    branch: { type: String, trim: true },
    currentStatus: { type: String, enum: PARCEL_STATUSES, default: "created" },
    assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Parcel = mongoose.model("Parcel", parcelSchema);
