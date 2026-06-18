/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Starters' | 'Mains' | 'Desserts' | 'Beverages';

export type OrderStatus = 'received' | 'cooking' | 'ready' | 'served' | 'cancelled';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: Category;
  badges: string[];
  ingredients: string[];
  calories: number;
  prepTime: number; // in minutes
  colorLeak: string; // Tailwind/HEX or rgba for custom background glow
  spiciness?: number; // 0 to 3 index
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery?: string; // clock time
}

// Complete set of 24 curated culinary works of art
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dish-1',
    name: 'Truffle Seared Scallops',
    price: 34.00,
    description: 'Pan-seared Hokkaido scallops finished with a white truffle butter emulsion, served over a bed of sweet corn purée and topped with micro-cilantro and crispy pancetta dust.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEV5fK4qTmrIYYAZfkxv2pmahwf1r1TOyvuF0dX2MBc66yEfGeaCJk1T1ILVaMfYKsEYJDl23O_lQnesn3JpJN38wMD4VUzg4Vt_h_xz1fChQ7TJekiKlyKjUjv_SDsCS7R8zn7Sh7Hzuups27L7uzEOcVme1Z6B4niQpmoEwhG4BzAb_c4KZ14j7Km7UtgGPPh2QickJIrmxGlPViZ53XpNezuDI9IUGiC8IQl2db0TyKF5__vvvoZWHkDIntOwKOUcIM212sDkI',
    category: 'Starters',
    badges: ['POPULAR', 'NEW'],
    ingredients: ['Hokkaido Scallops', 'White Truffle Butter', 'Sweet Corn Purée', 'Micro-Cilantro', 'Pancetta Dust'],
    calories: 380,
    prepTime: 12,
    colorLeak: 'rgba(212, 225, 87, 0.4)' // Soft glowing green/lime
  },
  {
    id: 'dish-2',
    name: 'Heirloom Garden Salad',
    price: 22.00,
    description: 'Locally sourced heirloom tomatoes, compressed cucumber, and shaved fennel tossed in a light yuzu vinaigrette, garnished with edible blossoms.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2nyrMQITw8pnHg4xvJsUTicZF0-SiYU_kh0FY2gyeQCvBD4ms9jAfok4vtU3KZ88Z0j8wWYTeoX702sxp8rBHiK40-T0kTfQ_B809snwbVQYTpXeySEXCg2ShF5FP6AFV4o5aP-pX1i9-CDf1u1aNoPvqWgtWBwcXzNG_b0K69M8f09uKBDXR7Q4omZw4ABHHCRy50SURvrBl2hulhoXT_JEIFkvl2-cAMsLrbV36Vh1NP0aom4iVHpwaigWqFaKFIJEt5ZIri2E',
    category: 'Starters',
    badges: ['VEGAN'],
    ingredients: ['Heirloom Tomatoes', 'Compressed Cucumber', 'Shaved Fennel', 'Yuzu Vinaigrette', 'Edible Flowers'],
    calories: 190,
    prepTime: 8,
    colorLeak: 'rgba(255, 171, 145, 0.3)' // Soft glowing coral
  },
  {
    id: 'dish-3',
    name: 'Citrus Glazed Hamachi',
    price: 26.00,
    description: 'Slices of pristine yellowtail amberjack, dressed in a blood orange and ponzu glaze, garnished with ultra-thin jalapeño and finger lime caviar.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    category: 'Starters',
    badges: ['NEW'],
    ingredients: ['Hamachi', 'Blood Orange ponzu', 'Jalapeño Slices', 'Finger Lime Caviar'],
    calories: 240,
    prepTime: 10,
    colorLeak: 'rgba(129, 212, 250, 0.3)', // Icey light blue
    spiciness: 1
  },
  {
    id: 'dish-4',
    name: 'Crispy Wagyu Gyoza',
    price: 28.00,
    description: 'Artisanal pan-fried dumplings stuffed with hand-minced A5 Wagyu beef and aromatic chives, served with a black vinegar and ginger dipping sauce.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'Starters',
    badges: ['POPULAR'],
    ingredients: ['Wagyu Beef', 'Aromatic Chives', 'Hand-rolled Wrappers', 'Chili-Black Vinegar Sauce'],
    calories: 420,
    prepTime: 15,
    colorLeak: 'rgba(244, 143, 177, 0.3)' // Light warm rose
  },
  {
    id: 'dish-5',
    name: 'Foie Gras Torchon',
    price: 38.00,
    description: 'Silky smooth cured duck foie gras torchon, served with a spiced seasonal plum compote, toasted artisanal brioche, and fleur de sel flakes.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'Starters',
    badges: ['CHEF CHOICE'],
    ingredients: ['Foie Gras', 'Plum Compote', 'Toasted Brioche', 'Hibiscus Reduction'],
    calories: 490,
    prepTime: 10,
    colorLeak: 'rgba(186, 104, 200, 0.3)' // Light amethyst violet
  },
  {
    id: 'dish-6',
    name: 'Roasted Bone Marrow',
    price: 29.00,
    description: 'Charred canoe-cut beef bone marrow, paired with a bright parsley-caper herb salad and crusty sourdough grilled over absolute open woodfire.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Starters',
    badges: [],
    ingredients: ['Beef Bone Marrow', 'Parsley Caper Salad', 'Grilled Sourdough', 'Charred Lemon'],
    calories: 540,
    prepTime: 18,
    colorLeak: 'rgba(141, 110, 99, 0.3)' // Earthy amber-brown
  },
  {
    id: 'dish-7',
    name: 'Pan-Roasted Halibut',
    price: 46.00,
    description: 'Skin-on wild halibut fillet roasted to perfection, served alongside caramelized baby leeks, buttered fingerling potatoes, and a delicate saffron-shellfish broth.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['CHEF CHOICE'],
    ingredients: ['Wild Halibut', 'Saffron Broth', 'Fingerling Potatoes', 'Caramelized Leeks'],
    calories: 490,
    prepTime: 22,
    colorLeak: 'rgba(255, 213, 79, 0.3)' // Bright gold glow
  },
  {
    id: 'dish-8',
    name: 'A5 Miyazaki Wagyu',
    price: 110.00,
    description: '4oz of ultra-rare, perfectly-marbled A5 wagyu striploin briefly seared, served with charcoal-smoked sea salt, fresh grated wasabi root, and sweet soy glaze.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['POPULAR'],
    ingredients: ['A5 Miyazaki Wagyu', 'House-Smoked Salt', 'Fresh Grated Wasabi', 'Mirin Glaze'],
    calories: 780,
    prepTime: 20,
    colorLeak: 'rgba(239, 83, 80, 0.25)' // Regal ruby-red glow
  },
  {
    id: 'dish-9',
    name: 'Maple-Brined Duck Breast',
    price: 48.00,
    description: 'Slow-cooked duck breast with crisped skin, served with a cherry-porto reduction, sweet potato purée, and roasted organic baby carrots.',
    image: 'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['NEW'],
    ingredients: ['Duck Breast', 'Cherry Porto Reduction', 'Sweet Potato', 'Glazed Carrots'],
    calories: 610,
    prepTime: 25,
    colorLeak: 'rgba(236, 112, 99, 0.25)' // Warm magenta sunset
  },
  {
    id: 'dish-10',
    name: 'Truffle Butter Filet Mignon',
    price: 65.00,
    description: 'An 8oz prime center-cut tenderloin steak basted in rosemary-infused butter, served with a rich black truffle compound butter and potato purée.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: [],
    ingredients: ['Prime Filet Mignon', 'Black Truffle Butter', 'Yukon Gold Potatoes', 'Asparagus Spears'],
    calories: 820,
    prepTime: 24,
    colorLeak: 'rgba(121, 85, 72, 0.3)' // Rich dark bronze
  },
  {
    id: 'dish-11',
    name: 'Lobster Tagliolini',
    price: 52.00,
    description: 'House-made fresh egg ribbon pasta tossed with sweet Maine lobster chunks inside a rich crustacean stock, spiced with fresh red chili and heirloom cherry tomatoes.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['POPULAR'],
    ingredients: ['Sweet Maine Lobster', 'Fresh Tagliolini Pasta', 'Rich Shellfish Emulsion', 'Red Chili', 'Cherry Tomatoes'],
    calories: 690,
    prepTime: 18,
    colorLeak: 'rgba(255, 112, 67, 0.3)', // Vibrant lobster-orange
    spiciness: 1
  },
  {
    id: 'dish-12',
    name: 'Saffron Seafood Paella',
    price: 49.00,
    description: 'Bomba rice steeped in rich saffron stock, loaded with fresh blue prawns, Mediterranean mussels, calamari, squid ink, and slow-braised chicken thighs.',
    image: 'https://images.unsplash.com/photo-1534080391025-abf1ae0e7cf3?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: [],
    ingredients: ['Saffron Bomba Rice', 'Giant Tiger Prawns', 'Squid', 'New Zealand Mussels', 'Spanish Chorizo'],
    calories: 720,
    prepTime: 30,
    colorLeak: 'rgba(245, 127, 23, 0.25)' // Bright amber-yellow
  },
  {
    id: 'dish-13',
    name: 'Forest Mushroom Risotto',
    price: 38.00,
    description: 'Creamy acquarello aged carnaroli rice with pan-sautéed porcini, chanterelle, and hen-of-the-woods mushrooms, finished with 24-month aged parmesan.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['VEGAN'],
    ingredients: ['Carnaroli Rice', 'Porcini Mushrooms', 'Chanterelle Mushrooms', '24-Month aged Parmesan', 'Thyme Butter'],
    calories: 520,
    prepTime: 20,
    colorLeak: 'rgba(139, 195, 74, 0.25)' // Forest light-green
  },
  {
    id: 'dish-14',
    name: 'Herb-Crusted Rack of Lamb',
    price: 58.00,
    description: 'New Zealand lamb rack coated in a roasted garlic and herb panko crust, served with a mint pesto, heirloom roasted carrots, and red wine demi-glace.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: [],
    ingredients: ['Rack of Lamb', 'Mint Pesto Sauce', 'Herbed Brioche Panko', 'Pea Purée'],
    calories: 760,
    prepTime: 26,
    colorLeak: 'rgba(77, 182, 172, 0.25)' // Pale turquoise-mint
  },
  {
    id: 'dish-15',
    name: 'Roasted Cauliflower Steak',
    price: 32.00,
    description: 'Thick cut cross-section of organic white cauliflower spiced with warm ras el hanout, roasted crispy, over smoked almond romesco sauce and micro herb salad.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'Mains',
    badges: ['VEGAN'],
    ingredients: ['Organic Cauliflower', 'Romesco Almond Sauce', 'Sumac Shaved Radish', 'Herb Vinaigrette'],
    calories: 310,
    prepTime: 16,
    colorLeak: 'rgba(255, 183, 77, 0.25)' // Golden almond peach
  },
  {
    id: 'dish-16',
    name: 'Sicilian Pistachio Soufflé',
    price: 18.00,
    description: 'A light, perfectly-risen hot dessert soufflé infused with premium Bronte green pistachios, served with an organic white chocolate liquid core sauce poured tableside.',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: ['POPULAR', 'NEW'],
    ingredients: ['Sicilian Bronte Pistachio', 'Organic White Chocolate', 'Farm Eggs', 'Pistachio Powder'],
    calories: 410,
    prepTime: 18,
    colorLeak: 'rgba(197, 225, 165, 0.35)' // Delicate neon-pistachio green
  },
  {
    id: 'dish-17',
    name: 'Valrhona Chocolate Lava',
    price: 16.00,
    description: 'Decadent moist chocolate cake baked with a premium Valrhona Guanaja cocoa center, releasing warm liquid fudge upon first cut, topped with salted bourbon vanilla gelato.',
    image: 'https://images.unsplash.com/photo-1606341913983-e15eaf733103?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: [],
    ingredients: ['Valrhona Dark Chocolate', 'Vanilla Gelato', 'Sea Salt', 'Bourbon Caramel'],
    calories: 550,
    prepTime: 12,
    colorLeak: 'rgba(215, 204, 200, 0.4)' // Soft glowing cocoa-beige
  },
  {
    id: 'dish-18',
    name: 'Vanilla Crème Brûlée',
    price: 15.00,
    description: 'Creamy, luxurious egg custard infused with real Madagascar vanilla bean caviar, topped with a glass-like caramelized sugar shell shattered tableside.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: [],
    ingredients: ['Madagascar Vanilla Bean', 'Custard', 'Caramelized Sugar', 'Macadamia Nut Crumbs'],
    calories: 340,
    prepTime: 6,
    colorLeak: 'rgba(255, 224, 178, 0.35)' // Soft caramel-amber glow
  },
  {
    id: 'dish-19',
    name: 'Lemon Meringue Sphere',
    price: 17.00,
    description: 'A crisp spun-sugar dome containing rich lemon curd, compressed fresh wild blackberries, vanilla bean sablé sand, and micro-torched Italian cloud meringue.',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: ['CHEF CHOICE'],
    ingredients: ['Yellow Lemon Curd', 'Italian Meringue', 'Wild Blackberries', 'Sablé Crumble'],
    calories: 310,
    prepTime: 14,
    colorLeak: 'rgba(255, 241, 118, 0.35)' // Pale bright lemon yellow
  },
  {
    id: 'dish-20',
    name: 'Matcha Affogato Ritual',
    price: 12.00,
    description: 'A generous scoop of premium sweet milk gelato, served alongside a hand-whisked bowl of organic ceremonial grade Uji matcha, poured fresh at checkout.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: ['NEW'],
    ingredients: ['Ceremonial Grade Matcha', 'Fior di Latte Gelato', 'Toasted Sesame Crackers'],
    calories: 220,
    prepTime: 8,
    colorLeak: 'rgba(165, 214, 167, 0.35)' // Ceremonial matcha glowing green
  },
  {
    id: 'dish-21',
    name: 'Artisanal Cheese Board',
    price: 24.00,
    description: 'A stellar, handpicked selection of cured world cheeses including Truffle Pecorino, 18-month Comté, and creamy Roquefort, with local honeycomb and figs.',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
    badges: [],
    ingredients: ['Truffle Pecorino', 'Comté', 'Roquefort Blue', 'Local Honeycomb', 'Smyrna Figs'],
    calories: 480,
    prepTime: 10,
    colorLeak: 'rgba(215, 204, 200, 0.25)' // Warm raw sandstone
  },
  {
    id: 'dish-22',
    name: 'Rosemary Old Fashioned',
    price: 22.00,
    description: 'Premium Kentucky high-rye bourbon whiskey, cold-steeped rosemary-demerara syrup, and angostura bitters, smoked in glass with natural oak spirals.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    category: 'Beverages',
    badges: ['POPULAR'],
    ingredients: ['Kentucky Bourbon', 'Rosemary Demerara Syrup', 'Angostura Bitters', 'Smoked Oak Spiral'],
    calories: 180,
    prepTime: 5,
    colorLeak: 'rgba(255, 138, 101, 0.25)' // Translucent amber bourbon glow
  },
  {
    id: 'dish-23',
    name: 'Hibiscus Yuzu Sparkler',
    price: 14.00,
    description: 'Fresh extracted organic yuzu citrus juice combined with slow-brewed hibiscus tea, sparkling mountain mineral water, and a crystalline sugar rim.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
    category: 'Beverages',
    badges: ['VEGAN'],
    ingredients: ['Yuzu Juice', 'Cold Brew Hibiscus', 'Carbonated Mineral Water', 'Citrus Peel'],
    calories: 90,
    prepTime: 4,
    colorLeak: 'rgba(244, 143, 177, 0.3)' // Flamboyant hibiscus pink
  },
  {
    id: 'dish-24',
    name: 'Golden Dragon Tribute Tea',
    price: 10.00,
    description: 'Premium whole-leaf golden-tipped black tea sourced from high mountains of Yunnan, delivering natural high-sweet notes of unsweetened cocoa and stone fruits.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    category: 'Beverages',
    badges: [],
    ingredients: ['Yunnan Golden-Tip Tea Leaves', 'Pure Hot Spring Water'],
    calories: 0,
    prepTime: 6,
    colorLeak: 'rgba(255, 183, 77, 0.3)' // Pure glowing golden nectar
  }
];
