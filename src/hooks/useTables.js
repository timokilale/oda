import { useCallback, useEffect, useRef, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiTableToView } from "../types/managementTypes.js";
import * as tableService from "../services/tableService.js";

const cache = new Map();

export default function useTables() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [tables, setTables] = useState(() => cache.get(restaurant.id) || []);

  const loadTables = useCallback(async () => {
    try {
      const data = await tableService.getTables(restaurant.id);
      const mapped = (data.tables || []).map(transformApiTableToView);
      cache.set(restaurant.id, mapped);
      setTables(mapped);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    if (!cache.has(restaurant.id)) {
      loadTables();
    }
  }, [loadTables, restaurant.id]);

  const addTable = useCallback(
    async ({ id, tableNumber }) => {
      clearFlash();
      try {
        await tableService.createTable(restaurant.id, { tableNumber });
        setFlash({ type: "success", message: `Table ${tableNumber} created.` });
        await Promise.all([loadTables(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadTables, refreshWorkspace, setFlash, clearFlash]
  );

  const deleteTable = useCallback(
    async (tableNumber) => {
      clearFlash();
      try {
        await tableService.deleteTable(restaurant.id, tableNumber);
        setFlash({ type: "success", message: `Table ${tableNumber} deleted.` });
        await Promise.all([loadTables(), refreshWorkspace()]);
      } catch (error) {
        setFlash({ type: "error", message: error.message });
      }
    },
    [restaurant.id, loadTables, refreshWorkspace, setFlash, clearFlash]
  );

  return { tables, setTables, addTable, deleteTable, restaurantRef: restaurant.ref || restaurant.id };
}
