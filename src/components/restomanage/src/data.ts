import { MenuItem, Order, Table, ActivityLog } from './types';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Signature Wagyu Burger',
    category: 'Mains',
    price: 24.50,
    description: 'Hand-crafted Wagyu beef patty with melting cheddar cheese, crisp heirloom lettuce, and artisanal brioche bun. Grilled to perfection with special chef sauce.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMGV85pYDOyzz8fXwz8YlppIflUUn9XblE1XaHs70CzxUUXEC5nTFyeWVndFnu3DFvzMQ8S38gQMF1K7o4E5lJpsZq3KJBnFO1OlNVVEk08ayGJ1QtRFKZ2Sjcp1ayYKYEwSsbBImguoQRsvACP671BB06x9ep_VBt5DaXxEKsn5Bkj-CY0GCVOyrfV8ZO7ngqqHc7NzS0LSpLsFpQsHJ0t6_MvG9Gxrqp3skEGoYx9Mf5xga2SvsWVzslo-dezrxO4m8yjeImuIs',
    badges: ['Popular', 'Mild'],
    spiciness: 1,
    ingredients: 'Wagyu beef patty, Cheddar cheese, Lettuce, Brioche bun, Secret house relish',
    calories: 820,
    prepTime: 18,
    status: 'Available',
    metrics: { label: 'High Margin', value: 85, color: 'success' }
  },
  {
    id: 'menu-2',
    name: 'Zesty Tuna Crudo',
    category: 'Starters',
    price: 18.00,
    description: 'A minimalist presentation of vibrant yellowfin tuna crudo with thin slices of radish, citrus zest, and garden-fresh microgreens, finished with lime truffle drizzle.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9ivknoDvdUCuzAVJbRAZ1eZRYydLtZe7GD3JHDBJGs9kkSXQqfaUDhUvZjN2muGpLxOc4TLBl9qrAXVh0p4blOduRWGD2JdjwsiHH_UyDx9GkAbBvFvzx-4tOyH3tGuE0Po1Vwd4nvAtrbaO1HOUmHf2Tq3mQ_xPsQX5Ji5BSWDEtRJkZDxz9gfO8AJ8U_9UPtHHiHRxkRKRDkoJmIPYHS8kU5qATKKuq7TV1TYvyXVToT4VgZPrbmJECkBmvtk5wjh4S6NjUskY',
    badges: ['New', 'Vegan'],
    spiciness: 0,
    ingredients: 'Yellowfin tuna, Radish, Citrus oil, Sea salt, Microgreens',
    calories: 245,
    prepTime: 9,
    status: 'Available',
    metrics: { label: 'Avg Demand', value: 40, color: 'pending' }
  },
  {
    id: 'menu-3',
    name: 'Truffle Risotto',
    category: 'Mains',
    price: 32.00,
    description: 'A warm, inviting copper pot containing steaming truffle mushroom arborio risotto. Creamy, textured, and garnished with shaved fresh black truffles.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtwyqS3xUYtmdnG8iRzGQCuKcoHn8uYXcrmYggGZJVXDgnim4l8sB4spvPtNimK0vl8V6zEj9TJSDgUhnpKA-FAGoLE5xmdqA4ShTHkMJWzHK2Fw0VluzAfAVaZlKYhwY8loq-FhF4PQhhrqI4Szz23wVfMFmJe7zTOGtR2fVglIUp8ujC-eHRPtAbphm-UzKBrXifC8E7djz-4O7Wy--xZluQQYl-mKeHJDlBZ_hs1QzCHYxDF9XFPTiVfH5_ljyp3ahU8iXjuzc',
    badges: ['Seasonal'],
    spiciness: 0,
    ingredients: 'Arborio rice, Wild mushrooms, Pecorino cheese, Fresh black truffle shavings, White wine, Garlic',
    calories: 580,
    prepTime: 25,
    status: 'Archived',
    metrics: { label: 'Low Stock', value: 10, color: 'outline' }
  },
  {
    id: 'menu-4',
    name: 'Volcano Red Curry',
    category: 'Asian Fusion',
    price: 19.50,
    description: 'Rich and aromatic Thai red curry bowl served with chunks of organic tofu, bamboo shoots, fresh basil leaves, and a fiery drizzle of artisan chili oil.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5SBW13ee6GcamcAuFwX6xH3z9qOkVQ5XL1CbqAulepYwVRCQz489bofc2Po54f3mVAzqXGzrB-mbBbocq3v8_MMGtUcg2tyzx2Y-2NxD66wHiUrEPYg_CA64amfDbe2k7KqNfaepOkhpEYl64Yz8RBrdYl_OqVBCSp-7BJAccd4q0tc5QKQw2LIhcF4Y23Qi_1RtmYm3bRk1nU_R3L5vm6XgRtL5_gFdqC6NSFuDjDYr4jTB5FpUD60q1JnR-dF7ohDJDCYPuQqY',
    badges: ['Hot'],
    spiciness: 4,
    ingredients: 'Thai red curry paste, Coconut milk, Organic tofu, Bamboo shoots, Basil leaves, Szechuan chili oil',
    calories: 490,
    prepTime: 14,
    status: 'Available',
    metrics: { label: 'High Velocity', value: 70, color: 'success' }
  },
  {
    id: 'menu-5',
    name: 'Truffle Tagliatelle',
    category: 'Mains',
    price: 24.00,
    description: 'Hand-made ribbon pasta served with fresh black truffle cream sauce, grated authentic pecorino cheese, and a delicate finish of white truffle oil.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMOBS-P8b6kn5ZTPEEDXaiEKl1oAvAzPuVu4k7GK7QqRkx3jeFW5-gPS-2K0DGMMk6fJbQU6iFMZvUfyC6JcgIzhvMp4KUnAFerUb9muaqxFy5kzwzwfzpmXoOUNjfIlnrlBtfJuTDwWZSasHIH5HXdSthiiRaknLy65v8wOTby79dL4xD3--e2YM5ffubxMws58ZXegNfUV9vPZk7HmjUzv0jpwc0Z2jjyLLNGNS9tUNtXIf-mDi6fozpHlVT1bCqjRc1FsGP56w',
    badges: ['Popular', 'Vegan'],
    spiciness: 0,
    ingredients: 'Fresh flour, Grade-A eggs, Water, Black truffle paste, Pecorino Romano, White truffle oil',
    calories: 650,
    prepTime: 15,
    status: 'Available',
    metrics: { label: 'High Margin', value: 92, color: 'success' }
  },
  {
    id: 'menu-6',
    name: 'Greek Artisan Salad',
    category: 'Starters',
    price: 16.00,
    description: 'Fresh Mediterranean salad with vine-ripened cherry tomatoes, Kalamata olives, creamy feta chunks, and garden-fresh cucumber slices with herb oil spray.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYEW7lpuX8ovh0QAifeOxbir1opRfUtKEPYZKkTeJj3-DEdjtw19c5-5tUziFajUg_7Ngw0kAWkvSQgoAlCeQ6IYuucaL8lZFN9qclXkQ1NVbuNDngLLeuOpwEa07Yuay_mg5mNOC6uZk-B6vthUmD6sOREDaSA-xRkqh8tcP5PsOsZzgoQOnAAUk2LOkR7h-slXgkHoduzj6bt3x5zL2kjfolo9e5-XHt0p01f-3ajYnm2busuMMr5LUz5Rws3YCDWvg7BZgp3_E',
    badges: ['New'],
    spiciness: 0,
    ingredients: 'Cherry tomatoes, Kalamata olives, Authentic Feta, Cucumber, Red onions, Oregano vinaigrette',
    calories: 310,
    prepTime: 7,
    status: 'Available',
    metrics: { label: 'High Velocity', value: 80, color: 'success' }
  },
  {
    id: 'menu-7',
    name: 'Hibiscus Lime Sparkler',
    category: 'Beverages',
    price: 8.00,
    description: 'Handcrafted premium cocktail with chilled organic hibiscus flower tea, freshly squeezed lime juice, mineral sparkling water, and fresh mint leaves.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX_fN4zaz9c89WnUWZI7U-eDVOJxLAm9Ep-MrLC338ykUAgvMarNPMtwUVHN2bay3iG5JDTct7gvqP25OksmZvh7GgTRQgFzFM1WpD9vWnFUy6OdSrGW2Ee9uAkza2uRXdfDMdAcaqxMaDjMyubBPYk8Z6X17MWzHG7uvCUmx7X9qwn5ByKVQ3M48CPCzzufe_5J5XKB3XlVWCPR3VLuhnOI3rysCKvMDKM1pQERp1iJyqi3_eSZAkwq9Mcuf43jZGrAi3A3aV1j8',
    badges: ['Popular'],
    spiciness: 0,
    ingredients: 'Organic dried hibiscus flowers, Lime wedges, Mint leaves, Raw cane sugar syrup, Sparkling water',
    calories: 120,
    prepTime: 4,
    status: 'Available',
    metrics: { label: 'High Margin', value: 95, color: 'success' }
  },
  {
    id: 'menu-8',
    name: 'Margherita Classica',
    category: 'Mains',
    price: 21.00,
    description: 'Authentic stone wood-fired Neapolitan pizza topped with rich volcanic San Marzano tomato coulis, fresh buffalo mozzarella circles, and aromatic basil leaves.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4kwJhJ0mlCvLP4ktsdmr4PevsDj9DZCix8kSLtQ97wCdjdAV46LmCmavo85dMavZ0zEMGx5BPVSAwpYlDxIG0s8ntS59zay_u-xSwMJLlozjHx5PK1olRHKV0CFxQHGIzLTt0L51AAWZ72JuOEcKiOZNx6OtigtYFig7OUSnCCeLOtW5kLJfajNkWtlQSQJ549jzCWBLwGhGF5NI3hg26y3YJUc6ZoEPOzR0ugB2OqNfBe9rSkcnYBkVVD-rLVtmzc3Ky4ojuGXM',
    badges: [],
    spiciness: 0,
    ingredients: 'Double-zero flour, Yeast, Sea salt, San Marzano tomatoes, Buffalo mozzarella, Fresh basil, Cold-pressed olive oil',
    calories: 740,
    prepTime: 12,
    status: 'Available',
    metrics: { label: 'High Velocity', value: 88, color: 'success' }
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: '#RM-4829',
    table: 'Table 12',
    status: 'Pending',
    items: [
      { name: 'Grilled Salmon Platter', quantity: 2, customization: 'Medium-Rare' },
      { name: 'Truffle Risotto', quantity: 1, customization: 'Extra Cheese' },
      { name: 'Iced Hibiscus Tea', quantity: 3, customization: 'No Sugar' }
    ],
    price: 124.50,
    timeAgo: '12m ago',
    timestamp: Date.now() - 12 * 60 * 1000
  },
  {
    id: '#RM-4828',
    table: 'Table 04',
    status: 'Confirmed',
    items: [
      { name: 'Wagyu Burger Deluxe', quantity: 1, customization: 'No Onions' },
      { name: 'Caesar Salad', quantity: 1, customization: 'Grilled Chicken' },
      { name: 'Sparkling Water', quantity: 2, customization: 'Lime' }
    ],
    price: 86.20,
    timeAgo: '24m ago',
    timestamp: Date.now() - 24 * 60 * 1000
  },
  {
    id: '#RM-4827',
    table: 'Takeaway (Web)',
    status: 'Confirmed',
    items: [
      { name: 'Margherita Pizza', quantity: 4, customization: 'Family Size' }
    ],
    price: 42.00,
    timeAgo: '31m ago',
    timestamp: Date.now() - 31 * 60 * 1000
  },
  {
    id: '#RM-4830',
    table: 'Table 18',
    status: 'Pending',
    items: [
      { name: 'Tiramisu', quantity: 1, customization: 'Chef\'s Special' },
      { name: 'Espresso Martini', quantity: 1, customization: 'Decaf' }
    ],
    price: 18.90,
    timeAgo: '2m ago',
    timestamp: Date.now() - 2 * 60 * 1000
  },
  {
    id: '#RM-4820',
    table: 'Table 02',
    status: 'Served',
    items: [
      { name: 'Greek Artisan Salad', quantity: 1 },
      { name: 'Truffle Tagliatelle', quantity: 1, customization: 'Extra Truffle Oil' },
      { name: 'Hibiscus Lime Sparkler', quantity: 1 }
    ],
    price: 55.00,
    timeAgo: '1h 04m ago',
    timestamp: Date.now() - 64 * 60 * 1000
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: '01', status: 'ACTIVE', scansCount: 42, activeOrdersCount: 2, qrVerified: true },
  { id: '02', status: 'ACTIVE', scansCount: 38, activeOrdersCount: 1, qrVerified: false },
  { id: '03', status: 'PENDING', scansCount: 15, activeOrdersCount: 0, qrVerified: false },
  { id: '04', status: 'ACTIVE', scansCount: 47, activeOrdersCount: 1, qrVerified: false }
];

export const INITIAL_LOGS: ActivityLog[] = [
  { id: 'log-1', text: 'Order #RM-4820 completed for Table 02', time: '2m ago', type: 'success' },
  { id: 'log-2', text: 'New pending order #RM-4830 received from Table 18', time: 'Just now', type: 'pending' },
  { id: 'log-3', text: 'Table 03 QR scanned by client browser', time: '10m ago', type: 'info' }
];
