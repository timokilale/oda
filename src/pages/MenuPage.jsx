import useMenu from "../hooks/useMenu.js";
import MenuView from "../components/management/MenuView.jsx";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";

export default function MenuPage() {
  const { restaurant } = useRestaurantWorkspace();
  const { items, setMenuItems, addItem, deleteItem } = useMenu();
  const settingsIncomplete = !(restaurant.name && restaurant.address && restaurant.city && restaurant.country && restaurant.phone);

  return (
    <MenuView
      menuItems={items}
      setMenuItems={setMenuItems}
      onAddItem={addItem}
      onDeleteItem={deleteItem}
      settingsIncomplete={settingsIncomplete}
    />
  );
}
