import { withTransaction } from "../../db.js";
import {
  canOwnerAddRestaurant,
  createRestaurantForOwner,
  getOwnerRestaurants,
  getRestaurantRecord,
  getWorkspaceSummary,
  updateRestaurantRecord,
} from "../../repository.js";
import {
  deleteUploadedAsset,
  HttpError,
  normalizeImagePosition,
  normalizePhoneNumber,
} from "../../utils.js";
import { getOwnedRestaurant } from "../ownerAccess.js";

export async function listOwnedRestaurants(owner) {
  const restaurants = await getOwnerRestaurants(owner.id);

  return {
    restaurants,
    ownerCanAddRestaurant: canOwnerAddRestaurant(owner, restaurants.length),
  };
}

export async function createOwnedRestaurant(owner, payload, imagePath) {
  const restaurants = await getOwnerRestaurants(owner.id);
  if (!canOwnerAddRestaurant(owner, restaurants.length)) {
    throw new HttpError(403, "Additional restaurants need admin access.");
  }

  const restaurantName = String(payload.restaurantName || "").trim();
  const city = String(payload.city || "").trim();
  const country = String(payload.country || "").trim();
  const restaurantImagePositionX = normalizeImagePosition(payload.restaurantImagePositionX);
  const restaurantImagePositionY = normalizeImagePosition(payload.restaurantImagePositionY);

  if (!restaurantName) {
    throw new HttpError(400, "Restaurant name is required.");
  }

  const restaurantId = await withTransaction((connection) =>
    createRestaurantForOwner(
      connection,
      owner.id,
      restaurantName,
      city,
      country,
      imagePath,
      restaurantImagePositionX,
      restaurantImagePositionY,
    ),
  );

  return getRestaurantRecord(restaurantId);
}

export async function getOwnedRestaurantWorkspace(ownerId, restaurantId) {
  const [restaurant, workspaceSummary] = await Promise.all([
    getOwnedRestaurant(ownerId, restaurantId),
    getWorkspaceSummary(restaurantId),
  ]);

  return { restaurant, workspaceSummary };
}

function parseActiveValue(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) {
    return fallback;
  }

  if (["true", "1", "yes", "active"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "0", "no", "inactive"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

export async function updateOwnedRestaurant(ownerId, restaurantId, payload, imagePath) {
  const currentRestaurant = await getOwnedRestaurant(ownerId, restaurantId);

  const restaurantName = String(payload.restaurantName || payload.name || "").trim();
  const address = String(payload.address || "").trim();
  const city = String(payload.city || "").trim();
  const country = String(payload.country || "").trim();
  const normalizedPhoneNumber = normalizePhoneNumber(payload.phone);
  const phone =
    payload.phone === undefined
      ? currentRestaurant.phone || null
      : normalizedPhoneNumber || null;
  const active = parseActiveValue(payload.active, currentRestaurant.active);
  const removeImage = String(payload.removeImage || "").trim().toLowerCase() === "true";

  if (!restaurantName) {
    throw new HttpError(400, "Restaurant name is required.");
  }

  const nextImagePath = removeImage ? null : imagePath ?? currentRestaurant.imageUrl ?? null;
  const imagePositionX = nextImagePath
    ? normalizeImagePosition(payload.restaurantImagePositionX ?? payload.imagePositionX ?? currentRestaurant.imagePositionX)
    : 50;
  const imagePositionY = nextImagePath
    ? normalizeImagePosition(payload.restaurantImagePositionY ?? payload.imagePositionY ?? currentRestaurant.imagePositionY)
    : 50;

  await updateRestaurantRecord(restaurantId, {
    name: restaurantName,
    address: address || null,
    city: city || null,
    country: country || null,
    phone,
    active,
    imagePath: nextImagePath,
    imagePositionX,
    imagePositionY,
  });

  if ((removeImage || imagePath) && currentRestaurant.imageUrl && currentRestaurant.imageUrl !== nextImagePath) {
    await deleteUploadedAsset(currentRestaurant.imageUrl);
  }

  return getOwnedRestaurantWorkspace(ownerId, restaurantId);
}
