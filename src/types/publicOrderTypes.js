const COLOR_LEAKS = [
  'rgba(212, 225, 87, 0.4)',
  'rgba(255, 171, 145, 0.3)',
  'rgba(129, 212, 250, 0.3)',
  'rgba(244, 143, 177, 0.3)',
  'rgba(186, 104, 200, 0.3)',
  'rgba(141, 110, 99, 0.3)',
  'rgba(255, 213, 79, 0.3)',
  'rgba(239, 83, 80, 0.25)',
  'rgba(236, 112, 99, 0.25)',
  'rgba(121, 85, 72, 0.3)',
  'rgba(255, 112, 67, 0.3)',
  'rgba(245, 127, 23, 0.25)',
  'rgba(139, 195, 74, 0.25)',
  'rgba(77, 182, 172, 0.25)',
  'rgba(255, 183, 77, 0.25)',
  'rgba(197, 225, 165, 0.35)',
  'rgba(215, 204, 200, 0.4)',
  'rgba(255, 224, 178, 0.35)',
  'rgba(255, 241, 118, 0.35)',
  'rgba(165, 214, 167, 0.35)',
  'rgba(215, 204, 200, 0.25)',
  'rgba(255, 138, 101, 0.25)',
  'rgba(244, 143, 177, 0.3)',
  'rgba(255, 183, 77, 0.3)',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function transformMenuItem(backendItem) {
  const cat = (backendItem.category || '').toLowerCase();
  let category = 'Mains';
  if (cat.includes('starter') || cat.includes('appetizer')) category = 'Starters';
  else if (cat.includes('dessert') || cat.includes('sweet')) category = 'Desserts';
  else if (cat.includes('beverage') || cat.includes('drink') || cat.includes('juice')) category = 'Beverages';

  return {
    id: String(backendItem.id),
    name: backendItem.name,
    price: Number(backendItem.price),
    description: backendItem.description || '',
    image: backendItem.imageUrl || '',
    category,
    badges: [],
    ingredients: [],
    calories: 0,
    prepTime: 0,
    colorLeak: COLOR_LEAKS[hashCode(String(backendItem.id || backendItem.name)) % COLOR_LEAKS.length],
    spiciness: 0,
  };
}

export function transformMenuItems(items) {
  return (items || []).map((item, i) => transformMenuItem(item, i));
}

export function backendOrderStatusToStep(status) {
  switch (status) {
    case 'pending': return 0;
    case 'confirmed': return 1;
    case 'completed': return 2;
    case 'cancelled': return -1;
    default: return 0;
  }
}

export const STATUS_LABELS = {
  pending: { label: 'Order Received', step: 0 },
  confirmed: { label: 'Chef is Cooking', step: 1 },
  completed: { label: 'Served', step: 2 },
  cancelled: { label: 'Cancelled', step: -1 },
};

export function transformOrder(backendOrder) {
  return {
    id: String(backendOrder.id),
    orderNumber: backendOrder.id,
    items: (backendOrder.items || []).map((item) => ({
      menuItem: {
        id: String(item.id),
        name: item.name,
        price: Number(item.price),
        image: item.imageUrl || '',
      },
      quantity: item.quantity || 1,
      specialNotes: '',
    })),
    subtotal: Number(backendOrder.subtotal || 0),
    tax: Number(backendOrder.tax || 0),
    serviceCharge: Number(backendOrder.serviceCharge || 0),
    total: Number(backendOrder.totalAmount || 0),
    status: backendOrder.status,
    createdAt: backendOrder.createdAt || new Date().toISOString(),
  };
}
