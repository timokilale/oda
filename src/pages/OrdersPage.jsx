import useOrders from "../hooks/useOrders.js";
import OrdersView from "../components/management/OrdersView.jsx";

export default function OrdersPage() {
  const { orders, setOrders, menuItems, acceptOrder, cancelOrder, markServed, recallOrder, addManualOrder } = useOrders();

  return (
    <OrdersView
      orders={orders}
      setOrders={setOrders}
      menuItems={menuItems}
      onAcceptOrder={acceptOrder}
      onCancelOrder={cancelOrder}
      onMarkServed={markServed}
      onRecallOrder={recallOrder}
      onAddManualOrder={addManualOrder}
    />
  );
}
