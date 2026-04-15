import express from "express";
import { asyncHandler } from "../../http/asyncHandler.js";
import { listOwnedRestaurantReports } from "../../services/owner/reports.js";

const router = express.Router();

router.get(
  "/:restaurantId/reports",
  asyncHandler(async (req, res) => {
    res.json(await listOwnedRestaurantReports(req.owner.id, req.params.restaurantId));
  }),
);

export default router;
