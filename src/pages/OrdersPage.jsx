import useOrders from "../hooks/useOrders.js";
import OrdersView from "../components/management/OrdersView.jsx";

export default function OrdersPage() {
  const { orders, acceptOrder, cancelOrder, markServed } = useOrders();

  return (
    <OrdersView
      orders={orders}
      onAcceptOrder={acceptOrder}
      onCancelOrder={cancelOrder}
      onMarkServed={markServed}
    />
  );
}
