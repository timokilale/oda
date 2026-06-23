import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { transformMenuItems, transformOrder } from '../types/publicOrderTypes';
import * as publicOrderService from '../services/publicOrderService';

const POLL_INTERVAL = 30000;

export default function usePublicOrder(restaurantRef, tableNumber) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');

  const [activeTab, setActiveTab] = useState('menu');
  const [swiperIndex, setSwiperIndex] = useState(0);
  const [detailItem, setDetailItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ordersMounted = useRef(false);

  useEffect(() => {
    if (!tableNumber || !restaurantRef) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setLookupError('');

    publicOrderService.getOrderContext(restaurantRef, tableNumber)
      .then((data) => { if (active) setContext(data); })
      .catch((error) => { if (active) { setContext(null); setLookupError(error.message); } })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [restaurantRef, tableNumber]);

  const menuItems = useMemo(
    () => transformMenuItems(context?.menuItems),
    [context?.menuItems],
  );

  const menuIsReady = Boolean(context?.menuItems?.length);

  const loadOrders = useCallback(async () => {
    try {
      const data = await publicOrderService.getOrders(restaurantRef, tableNumber);
      if (ordersMounted.current) setOrders(data.orders || []);
    } catch {
      // silent
    } finally {
      if (ordersMounted.current) setOrdersLoading(false);
    }
  }, [restaurantRef, tableNumber]);

  useEffect(() => {
    if (!tableNumber) return;
    ordersMounted.current = true;
    setOrdersLoading(true);
    loadOrders();
    const interval = setInterval(loadOrders, POLL_INTERVAL);
    return () => {
      ordersMounted.current = false;
      clearInterval(interval);
    };
  }, [loadOrders, tableNumber]);

  const triggerToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  }, []);

  const handleAddItem = useCallback((item, quantity, notes) => {
    setCart((prev) => {
      const matchIdx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (matchIdx > -1) {
        const copy = [...prev];
        copy[matchIdx] = {
          ...copy[matchIdx],
          quantity: copy[matchIdx].quantity + quantity,
          specialNotes: notes || copy[matchIdx].specialNotes,
        };
        return copy;
      }
      return [...prev, { menuItem: item, quantity, specialNotes: notes || '' }];
    });
    triggerToast(`Added ${quantity}x ${item.name}`);
  }, [triggerToast]);

  const handleRemoveCartItem = useCallback((dishId) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== dishId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handlePlaceOrder = useCallback(async (orderNotes) => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await publicOrderService.createOrder(
        restaurantRef,
        tableNumber,
        cart.map((c) => ({ id: Number(c.menuItem.id), quantity: c.quantity })),
      );
      setCart([]);
      setActiveTab('status');
      triggerToast(response.successMessage || 'Order placed!');
      await loadOrders();
    } catch (error) {
      triggerToast(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }, [cart, submitting, restaurantRef, tableNumber, loadOrders, triggerToast]);

  const cartQuantities = useMemo(() => {
    return cart.reduce((acc, cur) => {
      acc[cur.menuItem.id] = (acc[cur.menuItem.id] || 0) + cur.quantity;
      return acc;
    }, {});
  }, [cart]);

  const cartPlatesTotalCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const transformedOrders = useMemo(() => (orders || []).map(transformOrder), [orders]);
  const activeOrders = useMemo(
    () => transformedOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed'),
    [transformedOrders],
  );
  const completedOrders = useMemo(
    () => transformedOrders.filter((o) => o.status === 'completed' || o.status === 'cancelled'),
    [transformedOrders],
  );

  return {
    context, loading, lookupError,
    menuItems, menuIsReady,
    activeTab, setActiveTab,
    swiperIndex, setSwiperIndex,
    detailItem, setDetailItem,
    toastMessage, triggerToast,
    cart, cartQuantities, cartPlatesTotalCount,
    handleAddItem, handleRemoveCartItem, handleClearCart,
    orders, activeOrders, completedOrders, ordersLoading,
    submitting, handlePlaceOrder,
  };
}
