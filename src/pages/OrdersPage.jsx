import useOrders from "../hooks/useOrders.js";
import OrdersView from "../components/management/OrdersView.jsx";

export default function OrdersPage() {
  const { orders, menuItems, acceptOrder, cancelOrder, markServed, addManualOrder } = useOrders();

  return (
    <OrdersView
      orders={orders}
      menuItems={menuItems}
      onAcceptOrder={acceptOrder}
      onCancelOrder={cancelOrder}
      onMarkServed={markServed}
      onAddManualOrder={addManualOrder}
    />
  );
}
