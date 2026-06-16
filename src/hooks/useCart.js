import { useMemo } from "react";

const MAX_QUANTITY = 20;

export function useCart(menuItems, quantities, setQuantities) {
  const cartItems = useMemo(() => {
    const items = [];
    let count = 0;
    let total = 0;

    (menuItems || []).forEach((item) => {
      const quantity = Number(quantities[String(item.id)] || 0);
      if (!quantity) return;
      count += quantity;
      total += quantity * Number(item.price || 0);
      items.push({
        id: item.id,
        name: item.name,
        quantity,
        subtotal: quantity * Number(item.price || 0),
      });
    });

    return { items, count, total };
  }, [menuItems, quantities]);

  function updateQuantity(itemId, delta) {
    setQuantities((current) => {
      const nextValue = Math.max(0, Math.min(MAX_QUANTITY, Number(current[String(itemId)] || 0) + delta));
      return { ...current, [String(itemId)]: nextValue };
    });
  }

  function clearCart() {
    setQuantities({});
  }

  const visibleSummary =
    cartItems.items.length === 0
      ? ""
      : cartItems.items.length === 1
        ? cartItems.items[0].name
        : `${cartItems.items[0].name} + ${cartItems.items.length - 1} more`;

  return { cartItems, visibleSummary, updateQuantity, clearCart };
}
