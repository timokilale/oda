import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <>
      <section className="flex items-start justify-between gap-4 py-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">QR Codes</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-6">
          <Link
            to={`/restaurants/${restaurant.id}/tables/new`}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline"
          >
            Add tables (bulk)
          </Link>
        </div>
      </section>

      <TablesView
        tables={tables}
        setTables={setTables}
        onAddTable={handleAddTable}
        restaurantName={restaurant.ref || restaurant.name}
        qrBaseUrl={window.location.origin}
      />
    </>
  );
}
