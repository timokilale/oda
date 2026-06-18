export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  badges: string[]; // ['Popular', 'New', 'Vegan', 'Chef\'s Pick', 'Seasonal', 'Hot', 'Mild']
  spiciness: number; // 0 to 5
  ingredients: string;
  calories: number;
  prepTime: number; // in minutes
  status: 'Available' | 'Archived';
  metrics: {
    label: string;
    value: number; // percentage width for progress display (e.g. 85)
    color: string; // e.g. 'success' | 'pending' | 'outline'
  };
}

export interface MenuItemInput {
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  badges: string[];
  spiciness: number;
  ingredients: string;
  calories: number;
  prepTime: number;
  status: 'Available' | 'Archived';
}

export interface OrderItem {
  name: string;
  quantity: number;
  customization?: string;
}

export interface Order {
  id: string; // e.g., '#RM-4829'
  table: string; // e.g., 'Table 12' or 'Takeaway (Web)'
  status: 'Pending' | 'Confirmed' | 'Served' | 'Cancelled';
  items: OrderItem[];
  price: number;
  timeAgo: string; // original timestamp label
  timestamp: number; // millisecond timestamp of creation
}

export interface Table {
  id: string; // e.g., '01', '02'
  status: 'ACTIVE' | 'PENDING';
  scansCount: number;
  activeOrdersCount: number;
  qrVerified: boolean;
}

export interface ActivityLog {
  id: string;
  text: string;
  time: string;
  type: 'success' | 'pending' | 'info';
}
