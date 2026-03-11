import { Parcel } from "../models/Parcel.js";
import { StatusLog } from "../models/StatusLog.js";
import { User } from "../models/User.js";
import { ROLES } from "../utils/roles.js";

const pendingStatuses = ["created", "picked_up", "in_transit", "out_for_delivery"];

const ensureBranch = (req, res) => {
  if (!req.user.branch) {
    res.status(400).json({ message: "Branch manager must be assigned to a branch" });
    return null;
  }

  return req.user.branch;
};

export const getBranchManagerDashboard = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const [
      summaryAgg,
      parcels,
      riders,
      pendingAssignments,
      statusBreakdown,
      riderWorkload,
    ] =
      await Promise.all([
        Parcel.aggregate([
          { $match: { branch } },
          {
            $group: {
              _id: null,
              totalParcels: { $sum: 1 },
              deliveredParcels: {
                $sum: { $cond: [{ $eq: ["$currentStatus", "delivered"] }, 1, 0] },
              },
              pendingParcels: {
                $sum: { $cond: [{ $in: ["$currentStatus", pendingStatuses] }, 1, 0] },
              },
            },
          },
        ]),
        Parcel.find({ branch })
          .populate("assignedRider", "name email branch")
          .sort({ createdAt: -1 })
          .limit(120),
        User.find({ role: ROLES.RIDER, branch })
          .select("name email branch createdAt")
          .sort({ createdAt: -1 }),
        Parcel.find({ branch, assignedRider: { $in: [null, undefined] } })
          .sort({ createdAt: -1 })
          .limit(80),
        Parcel.aggregate([
          { $match: { branch } },
          { $group: { _id: "$currentStatus", total: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        Parcel.aggregate([
          { $match: { branch, assignedRider: { $ne: null } } },
          { $group: { _id: "$assignedRider", totalAssigned: { $sum: 1 } } },
          { $sort: { totalAssigned: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "rider",
            },
          },
          { $unwind: "$rider" },
          {
            $project: {
              _id: 0,
              riderId: "$rider._id",
              riderName: "$rider.name",
              riderEmail: "$rider.email",
              totalAssigned: 1,
            },
          },
        ]),
      ]);

    const summary = summaryAgg[0] || {
      totalParcels: 0,
      deliveredParcels: 0,
      pendingParcels: 0,
    };

    return res.json({
      summary: {
        ...summary,
        riderCount: riders.length,
      },
      parcels,
      riders,
      pendingAssignments,
      reports: {
        statusBreakdown,
        riderWorkload,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listBranchParcels = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const query = { branch };
    if (req.query.status) {
      query.currentStatus = req.query.status;
    }

    const parcels = await Parcel.find(query)
      .populate("assignedRider", "name email branch")
      .sort({ createdAt: -1 })
      .limit(220);

    return res.json(parcels);
  } catch (error) {
    return next(error);
  }
};

export const createRider = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const rider = await User.create({
      name,
      email,
      password,
      role: ROLES.RIDER,
      branch,
    });

    return res.status(201).json({
      id: rider._id,
      name: rider.name,
      email: rider.email,
      role: rider.role,
      branch: rider.branch,
      createdAt: rider.createdAt,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteRider = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const rider = await User.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (rider.role !== ROLES.RIDER || rider.branch !== branch) {
      return res.status(403).json({ message: "You can only delete riders in your branch" });
    }

    await rider.deleteOne();
    return res.json({ message: "Rider deleted" });
  } catch (error) {
    return next(error);
  }
};

export const approveAssignment = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const { riderId, note } = req.body;
    const parcel = await Parcel.findById(req.params.parcelId);
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (parcel.branch !== branch) {
      return res.status(403).json({ message: "You can only approve assignments in your branch" });
    }

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== ROLES.RIDER || rider.branch !== branch) {
      return res.status(400).json({ message: "Invalid rider for this branch" });
    }

    parcel.assignedRider = rider._id;
    await parcel.save();

    await StatusLog.create({
      parcel: parcel._id,
      status: parcel.currentStatus,
      note: note || `Assignment approved by branch manager for rider ${rider.name}`,
      updatedBy: req.user._id,
    });

    const updatedParcel = await Parcel.findById(parcel._id).populate(
      "assignedRider",
      "name email branch",
    );

    return res.json(updatedParcel);
  } catch (error) {
    return next(error);
  }
};

export const generateBranchReports = async (req, res, next) => {
  try {
    const branch = ensureBranch(req, res);
    if (!branch) {
      return;
    }

    const [statusBreakdown, riderWorkload] = await Promise.all([
      Parcel.aggregate([
        { $match: { branch } },
        { $group: { _id: "$currentStatus", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Parcel.aggregate([
        { $match: { branch, assignedRider: { $ne: null } } },
        { $group: { _id: "$assignedRider", totalAssigned: { $sum: 1 } } },
        { $sort: { totalAssigned: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "rider",
          },
        },
        { $unwind: "$rider" },
        {
          $project: {
            _id: 0,
            riderId: "$rider._id",
            riderName: "$rider.name",
            riderEmail: "$rider.email",
            totalAssigned: 1,
          },
        },
      ]),
    ]);

    return res.json({
      branch,
      statusBreakdown,
      riderWorkload,
    });
  } catch (error) {
    return next(error);
  }
};
