import { createContext, useContext } from "react";

export const RestaurantWorkspaceContext = createContext(null);

export function useRestaurantWorkspace() {
  const context = useContext(RestaurantWorkspaceContext);

  if (!context) {
    throw new Error("useRestaurantWorkspace must be used within RestaurantWorkspaceContext.");
  }

  return context;
}
