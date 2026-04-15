import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

export function useResolvedCanAddRestaurant(owner, ownerCanAddRestaurant) {
  const [resolvedCanAddRestaurant, setResolvedCanAddRestaurant] = useState(
    ownerCanAddRestaurant ?? false,
  );

  useEffect(() => {
    let active = true;

    async function syncCanAddRestaurant(forceRemote = false) {
      if (!owner) {
        if (active) {
          setResolvedCanAddRestaurant(false);
        }
        return false;
      }

      if (!forceRemote && ownerCanAddRestaurant !== undefined) {
        if (active) {
          setResolvedCanAddRestaurant(ownerCanAddRestaurant);
        }
        return ownerCanAddRestaurant;
      }

      try {
        const data = await apiRequest("/restaurants");
        if (active) {
          setResolvedCanAddRestaurant(Boolean(data.ownerCanAddRestaurant));
        }
        return Boolean(data.ownerCanAddRestaurant);
      } catch {
        if (active) {
          setResolvedCanAddRestaurant(false);
        }
        return false;
      }
    }

    syncCanAddRestaurant();

    return () => {
      active = false;
    };
  }, [owner, ownerCanAddRestaurant]);

  async function refreshResolvedCanAddRestaurant(options = {}) {
    if (!owner) {
      setResolvedCanAddRestaurant(false);
      return false;
    }

    if (!options.forceRemote && ownerCanAddRestaurant !== undefined) {
      setResolvedCanAddRestaurant(ownerCanAddRestaurant);
      return ownerCanAddRestaurant;
    }

    try {
      const data = await apiRequest("/restaurants");
      const nextValue = Boolean(data.ownerCanAddRestaurant);
      setResolvedCanAddRestaurant(nextValue);
      return nextValue;
    } catch {
      setResolvedCanAddRestaurant(false);
      return false;
    }
  }

  return {
    resolvedCanAddRestaurant,
    refreshResolvedCanAddRestaurant,
  };
}
