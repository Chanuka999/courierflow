import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, branch } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({ name, email, password, role, branch });
    return res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const profile = async (req, res) => {
  res.json({ user: req.user });
};
