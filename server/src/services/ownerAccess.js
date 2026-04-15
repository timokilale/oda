import { ensureOwnerRestaurantAccess, getRestaurantRecord } from "../repository.js";
import { HttpError } from "../utils.js";

export async function getOwnedRestaurant(ownerId, restaurantId) {
  await ensureOwnerRestaurantAccess(ownerId, restaurantId);

  const restaurant = await getRestaurantRecord(restaurantId);
  if (!restaurant) {
    throw new HttpError(404, "Restaurant not found.");
  }

  return restaurant;
}
