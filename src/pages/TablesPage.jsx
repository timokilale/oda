import { useCallback, useEffect, useState } from "react";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import TablesView from "../components/management/TablesView.jsx";
import { transformApiTableToView } from "../types/managementTypes.js";

export default function TablesPage() {
  const { restaurant, refreshWorkspace, setFlash, clearFlash } = useRestaurantWorkspace();
  const [tables, setTables] = useState([]);

  usePageTitle(`Tables - ${restaurant.name}`);

  const loadTables = useCallback(async () => {
    try {
      const data = await apiRequest(`/restaurants/${restaurant.id}/tables`);
      setTables((data.tables || []).map(transformApiTableToView));
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => { loadTables(); }, [loadTables]);

  async function handleAddTable({ id, tableNumber }) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables`, {
        method: "POST",
        body: { tableNumber },
      });
      setFlash({ type: "success", message: `Table ${tableNumber} created.` });
      await Promise.all([loadTables(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  async function handleDeleteTable(tableNumber) {
    clearFlash();
    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables/${tableNumber}`, { method: "DELETE" });
      setFlash({ type: "success", message: `Table ${tableNumber} deleted.` });
      await Promise.all([loadTables(), refreshWorkspace()]);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    }
  }

  return (
    <>
      <TablesView
        tables={tables}
        setTables={setTables}
        onAddTable={handleAddTable}
        onDeleteTable={handleDeleteTable}
        restaurantName={restaurant.ref || restaurant.name}
        qrBaseUrl={window.location.origin}
      />
    </>
  );
}
