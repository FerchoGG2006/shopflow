export type BusinessCategory =
  | 'restaurant'
  | 'jewelry'
  | 'clothing'
  | 'electronics'
  | 'bakery'
  | 'cosmetics'
  | 'other';

export interface Business {
  id: string;
  slug: string;           // tuapp.com/este-slug
  name: string;
  description: string;
  category: BusinessCategory;
  logoUrl?: string;
  bannerUrl?: string;
  whatsappNumber: string; // format: 573001234567
  currency: string;       // COP, MXN, USD, etc.
  accentColor: string;    // hex, ej: #E84545
  ownerId: string;
  plan: 'free' | 'pro' | 'business';
  active: boolean;
  createdAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  available: boolean;
  featured: boolean;
  order: number;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  businessId: string;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes?: string;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'online';
  paymentProofUrl?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  topProducts: { name: string; count: number }[];
  ordersByDay: { date: string; orders: number; revenue: number }[];
  pendingOrders: number;
}
