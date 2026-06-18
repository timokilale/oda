import useTables from "../hooks/useTables.js";
import TablesView from "../components/management/TablesView.jsx";

export default function TablesPage() {
  const { tables, setTables, addTable, deleteTable } = useTables();

  return (
    <TablesView
      tables={tables}
      setTables={setTables}
      onAddTable={addTable}
      onDeleteTable={deleteTable}
    />
  );
}
