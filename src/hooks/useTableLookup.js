import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

export function useTableLookup(restaurantRef) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableQuery = searchParams.get("table") || "";
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(Boolean(tableQuery));
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadContext() {
      if (!tableQuery) {
        if (!active) return;
        setContext(null);
        setLoading(false);
        setLookupError("");
        return;
      }

      setLoading(true);
      setLookupError("");

      try {
        const data = await apiRequest(
          `/public/restaurants/${encodeURIComponent(restaurantRef)}/order-context?table=${encodeURIComponent(tableQuery)}`,
        );
        if (!active) return;
        setContext(data);
      } catch (error) {
        if (!active) return;
        setContext(null);
        setLookupError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContext();
    return () => { active = false; };
  }, [restaurantRef, tableQuery]);

  const handleLookup = useCallback((tableInput) => {
    setSearchParams(tableInput.trim() ? { table: tableInput.trim() } : {});
  }, [setSearchParams]);

  const menuIsReady = Boolean(context?.menuItems?.length);

  return { context, loading, lookupError, tableQuery, menuIsReady, handleLookup };
}
