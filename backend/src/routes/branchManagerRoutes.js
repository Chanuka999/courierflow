import { Router } from "express";
import {
  approveAssignment,
  createRider,
  deleteRider,
  generateBranchReports,
  getBranchManagerDashboard,
  listBranchParcels,
} from "../controllers/branchManagerController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { ROLES } from "../utils/roles.js";

const router = Router();

router.use(protect, authorize(ROLES.BRANCH_MANAGER));

router.get("/dashboard", getBranchManagerDashboard);
router.get("/parcels", listBranchParcels);
router.post("/riders", createRider);
router.delete("/riders/:id", deleteRider);
router.patch("/assignments/:parcelId/approve", approveAssignment);
router.get("/reports", generateBranchReports);

export default router;
