import useTables from "../hooks/useTables.js";
import TablesView from "../components/management/TablesView.jsx";

export default function TablesPage() {
  const { tables, setTables, addTable, deleteTable, restaurantRef } = useTables();

  return (
    <TablesView
      tables={tables}
      setTables={setTables}
      onAddTable={addTable}
      onDeleteTable={deleteTable}
      restaurantRef={restaurantRef}
    />
  );
}
