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
    image: apiItem.imageUrl || '',
    status: apiItem.active !== false ? 'Available' : 'Archived',
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
    id: apiTable.id,
    tableNumber: apiTable.tableNumber,
    qrCodeUrl: apiTable.qrCodeUrl || null,
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
      sold: item.quantitySold || 0,
      revenue: item.revenue || 0,
    })),
  };
}
