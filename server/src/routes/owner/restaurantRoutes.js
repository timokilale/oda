import express from "express";
import { asyncHandler } from "../../http/asyncHandler.js";
import {
  getUploadedFileAsset,
  upload,
  validateUploadedRequestImage,
} from "../../http/uploads.js";
import {
  createOwnedRestaurant,
  getOwnedRestaurantWorkspace,
  listOwnedRestaurants,
  updateOwnedRestaurant,
} from "../../services/owner/restaurants.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await listOwnedRestaurants(req.owner));
  }),
);

router.post(
  "/",
  upload.single("restaurantImage"),
  asyncHandler(async (req, res) => {
    await validateUploadedRequestImage(req.file);

    const restaurant = await createOwnedRestaurant(req.owner, req.body, getUploadedFileAsset(req.file));
    res.status(201).json({ restaurant });
  }),
);

router.get(
  "/:restaurantId",
  asyncHandler(async (req, res) => {
    res.json(await getOwnedRestaurantWorkspace(req.owner.id, req.params.restaurantId));
  }),
);

router.patch(
  "/:restaurantId",
  upload.single("restaurantImage"),
  asyncHandler(async (req, res) => {
    await validateUploadedRequestImage(req.file);

    res.json(
      await updateOwnedRestaurant(
        req.owner.id,
        req.params.restaurantId,
        req.body,
        getUploadedFileAsset(req.file),
      ),
    );
  }),
);

export default router;
