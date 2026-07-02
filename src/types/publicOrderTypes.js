const COLOR_LEAKS = [
  '#e6c300',
  '#ff7b5a',
  '#3bc0f0',
  '#f06292',
  '#ab47bc',
  '#8d6e63',
  '#ffc107',
  '#e53935',
  '#e57373',
  '#6d4c41',
  '#ff5722',
  '#f57c00',
  '#7cb342',
  '#26a69a',
  '#ffa726',
  '#aed581',
  '#bcaaa4',
  '#ffcc80',
  '#fff176',
  '#81c784',
  '#a1887f',
  '#ff8a65',
  '#f48fb1',
  '#ffb74d',
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
    ingredients: backendItem.ingredients || '',
    calories: backendItem.calories || null,
    prepTime: backendItem.prepTime || null,
    spiciness: backendItem.spiciness ?? null,
    badges: backendItem.badges || [],
    image: backendItem.imageUrl || '',
    category,
    colorLeak: COLOR_LEAKS[hashCode(String(backendItem.id || backendItem.name)) % COLOR_LEAKS.length],
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
