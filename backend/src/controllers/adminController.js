import { Branch } from "../models/Branch.js";
import { Parcel } from "../models/Parcel.js";
import { User } from "../models/User.js";
import { ROLES } from "../utils/roles.js";

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [branches, users, parcelSummary, parcelsByBranch] = await Promise.all(
      [
        Branch.find()
          .populate("manager", "name email role")
          .sort({ createdAt: -1 }),
        User.find()
          .select("name email role branch createdAt")
          .sort({ createdAt: -1 }),
        Parcel.aggregate([
          {
            $group: {
              _id: null,
              totalParcels: { $sum: 1 },
              deliveredParcels: {
                $sum: {
                  $cond: [{ $eq: ["$currentStatus", "delivered"] }, 1, 0],
                },
              },
              pendingParcels: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        "$currentStatus",
                        [
                          "created",
                          "picked_up",
                          "in_transit",
                          "out_for_delivery",
                        ],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              codTotal: { $sum: "$codAmount" },
            },
          },
        ]),
        Parcel.aggregate([
          {
            $group: {
              _id: { $ifNull: ["$branch", "Unassigned"] },
              total: { $sum: 1 },
              delivered: {
                $sum: {
                  $cond: [{ $eq: ["$currentStatus", "delivered"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { total: -1, _id: 1 } },
        ]),
      ],
    );

    const summary = parcelSummary[0] || {
      totalParcels: 0,
      deliveredParcels: 0,
      pendingParcels: 0,
      codTotal: 0,
    };

    return res.json({
      summary: {
        ...summary,
        branchCount: branches.length,
        userCount: users.length,
      },
      branches,
      users,
      reports: {
        parcelsByBranch,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const { name, code, location, manager } = req.body;
    const branch = await Branch.create({
      name,
      code,
      location,
      manager: manager || undefined,
    });
    const populatedBranch = await Branch.findById(branch._id).populate(
      "manager",
      "name email role",
    );

    return res.status(201).json(populatedBranch);
  } catch (error) {
    return next(error);
  }
};

export const updateBranch = async (req, res, next) => {
  try {
    const { name, code, location, manager, isActive } = req.body;
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    if (name !== undefined) {
      branch.name = name;
    }

    if (code !== undefined) {
      branch.code = code;
    }

    if (location !== undefined) {
      branch.location = location;
    }

    if (manager !== undefined) {
      branch.manager = manager || undefined;
    }

    if (isActive !== undefined) {
      branch.isActive = isActive;
    }

    await branch.save();

    const populatedBranch = await Branch.findById(branch._id).populate(
      "manager",
      "name email role",
    );

    return res.json(populatedBranch);
  } catch (error) {
    return next(error);
  }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await branch.deleteOne();
    return res.json({ message: "Branch deleted" });
  } catch (error) {
    return next(error);
  }
};

export const createUserByAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, branch } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.CUSTOMER,
      branch,
    });

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user._id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();
    return res.json({ message: "User deleted" });
  } catch (error) {
    return next(error);
  }
};
