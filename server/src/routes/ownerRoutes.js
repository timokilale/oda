import express from "express";
import { requireOwner } from "../services/ownerAuth.js";
import menuRoutes from "./owner/menuRoutes.js";
import orderRoutes from "./owner/orderRoutes.js";
import reportRoutes from "./owner/reportRoutes.js";
import restaurantRoutes from "./owner/restaurantRoutes.js";
import tableRoutes from "./owner/tableRoutes.js";

const router = express.Router();

router.use(requireOwner);
router.use(restaurantRoutes);
router.use(menuRoutes);
router.use(tableRoutes);
router.use(orderRoutes);
router.use(reportRoutes);

export default router;
