import { Parcel } from "../models/Parcel.js";
import { StatusLog } from "../models/StatusLog.js";
import { User } from "../models/User.js";
import { notifyParcelStatusChange } from "../services/notificationService.js";
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

const riderAllowedStatuses = [
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
];

const normalizeBranch = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const buildBranchFilter = (branch) => ({
  $regex: `^${String(branch || "")
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
  $options: "i",
});

const isSameBranch = (left, right) =>
  normalizeBranch(left) === normalizeBranch(right);

const buildRiderAssignmentFilter = (userId) => ({
  $in: [userId, String(userId)],
});

export const uploadDeliveryProof = async (req, res, next) => {
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Proof image file is required" });
    }

    if (
      req.user.role === ROLES.RIDER &&
      String(parcel.assignedRider) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Only assigned rider can upload proof for this parcel",
      });
    }

    const proofImageUrl = `/uploads/proofs/${req.file.filename}`;

    await StatusLog.create({
      parcel: parcel._id,
      status: parcel.currentStatus,
      note: "Delivery proof image uploaded",
      proofImageUrl,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      message: "Proof image uploaded successfully",
      proofImageUrl,
      fileName: req.file.filename,
    });
  } catch (error) {
    return next(error);
  }
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
      query.branch = buildBranchFilter(req.user.branch);
    }

    if (req.user.role === ROLES.RIDER) {
      query.assignedRider = buildRiderAssignmentFilter(req.user._id);
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
      !isSameBranch(parcel.branch, req.user.branch)
    ) {
      return res
        .status(403)
        .json({ message: "You can only assign riders in your branch" });
    }

    const rider = await User.findById(riderId);

    if (!rider || rider.role !== ROLES.RIDER) {
      return res.status(400).json({ message: "Invalid rider" });
    }

    if (
      req.user.role === ROLES.BRANCH_MANAGER &&
      req.user.branch &&
      !isSameBranch(rider.branch, req.user.branch)
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

export const listRidersForAssignment = async (req, res, next) => {
  try {
    const query = { role: ROLES.RIDER };

    if (req.query.branch) {
      query.branch = req.query.branch;
    }

    const riders = await User.find(query)
      .select("name email branch")
      .sort({ createdAt: -1 })
      .limit(300);

    return res.json(riders);
  } catch (error) {
    return next(error);
  }
};

export const updateParcelDetailsBeforePickup = async (req, res, next) => {
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (parcel.currentStatus !== "created") {
      return res.status(400).json({
        message: "Parcel details can only be edited before pickup",
      });
    }

    const editableFields = [
      "senderName",
      "senderPhone",
      "senderEmail",
      "receiverName",
      "receiverPhone",
      "receiverEmail",
      "receiverAddress",
      "weightKg",
      "codAmount",
      "branch",
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        parcel[field] = req.body[field];
      }
    });

    await parcel.save();

    await StatusLog.create({
      parcel: parcel._id,
      status: parcel.currentStatus,
      note: "Parcel details updated before pickup",
      updatedBy: req.user._id,
    });

    return res.json(parcel);
  } catch (error) {
    return next(error);
  }
};

export const updateParcelStatus = async (req, res, next) => {
  try {
    const { status, note, location, proofImageUrl, signatureName } = req.body;
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

    if (
      req.user.role === ROLES.RIDER &&
      !riderAllowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Rider can only use: picked_up, in_transit, out_for_delivery, delivered, failed",
      });
    }

    const nextAllowed = allowedTransitions[parcel.currentStatus] || [];
    if (!nextAllowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${parcel.currentStatus} to ${status}`,
      });
    }

    if (
      req.user.role === ROLES.RIDER &&
      status === "delivered" &&
      !proofImageUrl
    ) {
      return res.status(400).json({
        message: "Rider must provide proofImageUrl for delivered status",
      });
    }

    parcel.currentStatus = status;
    await parcel.save();

    await StatusLog.create({
      parcel: parcel._id,
      status,
      note,
      location,
      proofImageUrl,
      signatureName,
      updatedBy: req.user._id,
    });

    try {
      await notifyParcelStatusChange({
        parcel,
        status,
        note,
        location,
      });
    } catch (notificationError) {
      console.error("Parcel status notification failed", notificationError);
    }

    return res.json(parcel);
  } catch (error) {
    return next(error);
  }
};

export const parcelMetrics = async (req, res, next) => {
  try {
    const branchFilter =
      req.user.role === ROLES.BRANCH_MANAGER && req.user.branch
        ? { branch: buildBranchFilter(req.user.branch) }
        : {};
    const riderFilter =
      req.user.role === ROLES.RIDER
        ? { assignedRider: buildRiderAssignmentFilter(req.user._id) }
        : {};
    const baseFilter = { ...branchFilter, ...riderFilter };

    const [total, delivered, pending] = await Promise.all([
      Parcel.countDocuments(baseFilter),
      Parcel.countDocuments({ ...baseFilter, currentStatus: "delivered" }),
      Parcel.countDocuments({
        ...baseFilter,
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
