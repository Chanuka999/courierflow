import { Router } from "express";
import {
  createBranch,
  createUserByAdmin,
  deleteBranch,
  deleteUserByAdmin,
  getAdminDashboard,
  updateBranch,
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = Router();

router.use(protect, authorize(ROLES.SUPER_ADMIN));

router.get("/dashboard", getAdminDashboard);
router.post("/branches", createBranch);
router.patch("/branches/:id", updateBranch);
router.delete("/branches/:id", deleteBranch);
router.post("/users", createUserByAdmin);
router.delete("/users/:id", deleteUserByAdmin);

export default router;
