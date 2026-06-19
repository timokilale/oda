import useTables from "../hooks/useTables.js";
import TablesView from "../components/management/TablesView.jsx";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

export default function TablesPage() {
  const { restaurant } = useRestaurantWorkspace();
  const { tables, setTables, addTable, deleteTable, restaurantRef } = useTables();
  const settingsIncomplete = !(restaurant.name && restaurant.address && restaurant.city && restaurant.country && restaurant.phone);

  return (
    <TablesView
      tables={tables}
      setTables={setTables}
      onAddTable={addTable}
      onDeleteTable={deleteTable}
      restaurantRef={restaurantRef}
      settingsIncomplete={settingsIncomplete}
    />
  );
}
