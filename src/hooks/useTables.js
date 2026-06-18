import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiTableToView } from "../types/managementTypes.js";
import * as tableService from "../services/tableService.js";

export default function useTables() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [tables, setTables] = useState([]);

  const loadTables = useCallback(async () => {
    try {
      const data = await tableService.getTables(restaurant.id);
      setTables((data.tables || []).map(transformApiTableToView));
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

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

  return { tables, setTables, addTable, deleteTable };
}
