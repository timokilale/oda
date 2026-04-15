import { getRestaurantReports } from "../../repository.js";
import { getOwnedRestaurant } from "../ownerAccess.js";

export async function listOwnedRestaurantReports(ownerId, restaurantId) {
  await getOwnedRestaurant(ownerId, restaurantId);

  return {
    reports: await getRestaurantReports(restaurantId),
  };
}
