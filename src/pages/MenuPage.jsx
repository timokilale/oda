import useMenu from "../hooks/useMenu.js";
import MenuView from "../components/management/MenuView.jsx";

export default function MenuPage() {
  const { items, setMenuItems, addItem, deleteItem } = useMenu();

  return (
    <MenuView
      menuItems={items}
      setMenuItems={setMenuItems}
      onAddItem={addItem}
      onDeleteItem={deleteItem}
    />
  );
}
