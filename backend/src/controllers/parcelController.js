import { Parcel } from "../models/Parcel.js";
import { StatusLog } from "../models/StatusLog.js";
import { User } from "../models/User.js";
import { generateTrackingId } from "../utils/generateTrackingId.js";
import { ROLES } from "../utils/roles.js";

const allowedTransitions = {
  created: ["picked_up", "failed", "returned"],
  picked_up: ["in_transit", "failed", "returned"],
  in_transit: ["out_for_delivery", "failed", "returned"],
  out_for_delivery: ["delivered", "failed", "returned"],
  delivered: [],
  failed: ["out_for_delivery", "returned"],
  returned: [],
};

export const createParcel = async (req, res, next) => {
  try {
    const trackingId = generateTrackingId();
    const parcel = await Parcel.create({
      ...req.body,
      trackingId,
      createdBy: req.user._id,
    });

    await StatusLog.create({
      parcel: parcel._id,
      status: parcel.currentStatus,
      note: "Parcel created",
      updatedBy: req.user._id,
    });

    return res.status(201).json(parcel);
  } catch (error) {
    return next(error);
  }
};

export const listParcels = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === ROLES.BRANCH_MANAGER && req.user.branch) {
      query.branch = req.user.branch;
    }

    if (req.query.status) {
      query.currentStatus = req.query.status;
    }

    if (req.query.branch && req.user.role !== ROLES.BRANCH_MANAGER) {
      query.branch = req.query.branch;
    }

    const parcels = await Parcel.find(query)
      .populate("assignedRider", "name email role")
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json(parcels);
  } catch (error) {
    return next(error);
  }
};

export const getParcelByTrackingId = async (req, res, next) => {
  try {
    const parcel = await Parcel.findOne({
      trackingId: req.params.trackingId,
    }).populate("assignedRider", "name role");

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    const logs = await StatusLog.find({ parcel: parcel._id }).sort({
      createdAt: -1,
    });
    return res.json({ parcel, logs });
  } catch (error) {
    return next(error);
  }
};

export const assignRider = async (req, res, next) => {
  try {
    const { riderId } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (
      req.user.role === ROLES.BRANCH_MANAGER &&
      req.user.branch &&
      parcel.branch !== req.user.branch
    ) {
      return res.status(403).json({ message: "You can only assign riders in your branch" });
    }

    const rider = await User.findById(riderId);

    if (!rider || rider.role !== ROLES.RIDER) {
      return res.status(400).json({ message: "Invalid rider" });
    }

    if (
      req.user.role === ROLES.BRANCH_MANAGER &&
      req.user.branch &&
      rider.branch !== req.user.branch
    ) {
      return res.status(400).json({ message: "Rider is not in your branch" });
    }

    parcel.assignedRider = riderId;
    await parcel.save();

    return res.json(parcel);
  } catch (error) {
    return next(error);
  }
};

export const updateParcelStatus = async (req, res, next) => {
  try {
    const { status, note, location } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (
      req.user.role === ROLES.RIDER &&
      String(parcel.assignedRider) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ message: "Only assigned rider can update this parcel" });
    }

    const nextAllowed = allowedTransitions[parcel.currentStatus] || [];
    if (!nextAllowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${parcel.currentStatus} to ${status}`,
      });
    }

    parcel.currentStatus = status;
    await parcel.save();

    await StatusLog.create({
      parcel: parcel._id,
      status,
      note,
      location,
      updatedBy: req.user._id,
    });

    return res.json(parcel);
  } catch (error) {
    return next(error);
  }
};

export const parcelMetrics = async (req, res, next) => {
  try {
    const branchFilter =
      req.user.role === ROLES.BRANCH_MANAGER && req.user.branch
        ? { branch: req.user.branch }
        : {};

    const [total, delivered, pending] = await Promise.all([
      Parcel.countDocuments(branchFilter),
      Parcel.countDocuments({ ...branchFilter, currentStatus: "delivered" }),
      Parcel.countDocuments({
        ...branchFilter,
        currentStatus: {
          $in: ["created", "picked_up", "in_transit", "out_for_delivery"],
        },
      }),
    ]);

    return res.json({ total, delivered, pending });
  } catch (error) {
    return next(error);
  }
};
