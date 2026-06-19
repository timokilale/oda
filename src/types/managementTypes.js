const IMAGE_PRESETS = [
  { label: 'Burger', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiu__j1Ve9suXJmSB64pBXfJWPggANsiYebEW-80OCmSiyGQo1k2b8yDYVZc8TUjzWPPesuDQ2rhMZbkhQXouZDSoPGqC9Qh5wpsZ40TVc-AxyyyTuly7cjZIXQaMczbUvw58J8gR97bczYH3RuN1RLk7K4XdC1xPXrW7yL6SaXBner1Zpe0KfGtl8nJAZesF0JT6maAISzBPrbTES0nrdM3qEyKS275AZckiTri-VmKBfHaXuLBoK0gVNrC0seAlJVwTB9HYGcqI' },
  { label: 'Truffle Pasta', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMOBS-P8b6kn5ZTPEEDXaiEKl1oAvAzPuVu4k7GK7QqRkx3jeFW5-gPS-2K0DGMMk6fJbQU6iFMZvUfyC6JcgIzhvMp4KUnAFerUb9muaqxFy5kzwzwfzpmXoOUNjfIlnrlBtfJuTDwWZSasHIH5HXdSthiiRaknLy65v8wOTby79dL4xD3--e2YM5ffubxMws58ZXegNfUV9vPZk7HmjUzv0jpwc0Z2jjyLLNGNS9tUNtXIf-mDi6fozpHlVT1bCqjRc1FsGP56w' },
  { label: 'Salad', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYEW7lpuX8ovh0QAifeOxbir1opRfUtKEPYZKkTeJj3-DEdjtw19c5-5tUziFajUg_7Ngw0kAWkvSQgoAlCeQ6IYuucaL8lZFN9qclXkQ1NVbuNDngLLeuOpwEa07Yuay_mg5mNOC6uZk-B6vthUmD6sOREDaSA-xRkqh8tcP5PsOsZzgoQOnAAUk2LOkR7h-slXgkHoduzj6bt3x5zL2kjfolo9e5-XHt0p01f-3ajYnm2busuMMr5LUz5Rws3YCDWvg7BZgp3_E' },
  { label: 'Hibiscus Drink', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX_fN4zaz9c89WnUWZI7U-eDVOJxLAm9Ep-MrLC338ykUAgvMarNPMtwUVHN2bay3iG5JDTct7gvqP25OksmZvh7GgTRQgFzFM1WpD9vWnFUy6OdSrGW2Ee9uAkza2uRXdfDMdAcaqxMaDjMyubBPYk8Z6X17MWzHG7uvCUmx7X9qwn5ByKVQ3M48CPCzzufe_5J5XKB3XlVWCPR3VLuhnOI3rysCKvMDKM1pQERp1iJyqi3_eSZAkwq9Mcuf43jZGrAi3A3aV1j8' },
  { label: 'Classic Pizza', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4kwJhJ0mlCvLP4ktsdmr4PevsDj9DZCix8kSLtQ97wCdjdAV46LmCmavo85dMavZ0zEMGx5BPVSAwpYlDxIG0s8ntS59zay_u-xSwMJLlozjHx5PK1olRHKV0CFxQHGIzLTt0L51AAWZ72JuOEcKiOZNx6OtigtYFig7OUSnCCeLOtW5kLJfajNkWtlQSQJ549jzCWBLwGhGF5NI3hg26y3YJUc6ZoEPOzR0ugB2OqNfBe9rSkcnYBkVVD-rLVtmzc3Ky4ojuGXM' },
];

export { IMAGE_PRESETS };

const BADGE_OPTIONS = ['Popular', 'New', 'Vegan', 'Chef\'s Pick', 'Seasonal'];

const METRICS_POOL = [
  { label: 'High Margin', value: 85, color: 'success' },
  { label: 'Avg Demand', value: 50, color: 'pending' },
  { label: 'High Velocity', value: 75, color: 'success' },
  { label: 'Low Stock', value: 15, color: 'outline' },
];

export function parseDate(value) {
  if (!value) return NaN;
  const s = String(value);
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (match) {
    const [, y, m, d, hh, mm, ss, tz] = match;
    const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}${tz || 'Z'}`;
    return Date.parse(iso);
  }
  return Date.parse(s);
}

export function timeAgoLabel(date) {
  const ts = parseDate(date);
  if (isNaN(ts)) return '';
  const diff = Date.now() - ts;
  if (diff < 0) return 'Just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours < 24) return `${hours}h ${remaining}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function transformApiOrderToView(apiOrder) {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Served',
    cancelled: 'Cancelled',
  };
  return {
    id: `#${apiOrder.id}`,
    table: `Table ${apiOrder.tableNumber}`,
    status: statusMap[apiOrder.status] || 'Pending',
    items: (apiOrder.items || []).map((it) => ({
      name: it.name || it.menuItemName || 'Item',
      quantity: it.quantity || 1,
      customization: it.customization || it.notes || '',
    })),
    price: apiOrder.totalAmount || 0,
    timeAgo: timeAgoLabel(apiOrder.createdAt),
    timestamp: parseDate(apiOrder.createdAt) || Date.now(),
  };
}

export function transformApiMenuItemToView(apiItem) {
  return {
    id: apiItem.id,
    name: apiItem.name,
    price: apiItem.price,
    category: apiItem.category || 'Mains',
    description: apiItem.description || '',
    image: apiItem.imageUrl || IMAGE_PRESETS[0].url,
    badges: apiItem.badges || [],
    spiciness: apiItem.spiciness ?? 0,
    ingredients: apiItem.ingredients || '',
    calories: apiItem.calories ?? 400,
    prepTime: apiItem.prepTime ?? 15,
    status: apiItem.active !== false ? 'Available' : 'Archived',
    metrics: METRICS_POOL[Math.floor(Math.random() * METRICS_POOL.length)],
  };
}

export function transformViewItemToApiPayload(item) {
  return {
    name: item.name,
    price: item.price,
    category: item.category,
    description: item.description,
    imageUrl: item.image,
    active: item.status === 'Available',
  };
}

export function transformApiTableToView(apiTable) {
  return {
    id: String(apiTable.tableNumber).padStart(2, '0'),
    status: apiTable.active !== false ? 'ACTIVE' : 'PENDING',
    scansCount: apiTable.scansCount ?? 0,
    activeOrdersCount: apiTable.activeOrdersCount ?? 0,
    qrVerified: Boolean(apiTable.qrCodeUrl),
    qrCodeUrl: apiTable.qrCodeUrl || null,
    tableNumber: apiTable.tableNumber,
  };
}

export function transformApiReportsToView(apiReports) {
  if (!apiReports) return null;
  return {
    revenue: apiReports.revenueTotal || 0,
    orders: apiReports.ordersToday || 0,
    totalOrders: apiReports.totalOrders || 0,
    avgTicket: apiReports.averageTicket || 0,
    completion: apiReports.completionRate ? Math.round(apiReports.completionRate) : 0,
    pendingCount: apiReports.pendingOrders || 0,
    confirmedCount: apiReports.confirmedOrders || 0,
    completedCount: apiReports.completedOrders || 0,
    cancelledCount: apiReports.cancelledOrders || 0,
    topItems: (apiReports.topItems || []).map((item) => ({
      name: item.name,
      category: item.category || '',
      sold: item.quantitySold || 0,
      revenue: item.revenue || 0,
    })),
  };
}

export { BADGE_OPTIONS, METRICS_POOL };
