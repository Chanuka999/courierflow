import { Router } from "express";
import {
  assignRider,
  createParcel,
  getParcelByTrackingId,
  listParcels,
  parcelMetrics,
  updateParcelStatus,
} from "../controllers/parcelController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { ROLES, STAFF_ROLES } from "../utils/roles.js";

const router = Router();

router.get("/tracking/:trackingId", getParcelByTrackingId);
router.get("/metrics", protect, authorize(...STAFF_ROLES), parcelMetrics);
router.get("/", protect, authorize(...STAFF_ROLES), listParcels);
router.post(
  "/",
  protect,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.DISPATCHER,
  ),
  createParcel,
);
router.patch(
  "/:id/assign",
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.BRANCH_MANAGER, ROLES.DISPATCHER),
  assignRider,
);
router.patch(
  "/:id/status",
  protect,
  authorize(
    ROLES.SUPER_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.DISPATCHER,
    ROLES.RIDER,
  ),
  updateParcelStatus,
);

export default router;
