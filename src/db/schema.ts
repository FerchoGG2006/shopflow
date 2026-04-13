import { pgTable, text, timestamp, boolean, doublePrecision, integer, uniqueIndex, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(), // We'll keep using Firebase UID or a string ID
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  whatsappNumber: text('whatsapp_number').notNull(),
  currency: text('currency').notNull().default('COP'),
  accentColor: text('accent_color').notNull().default('#E84545'),
  ownerId: text('owner_id').notNull(),
  plan: text('plan').notNull().default('free'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productCategories = pgTable('product_categories', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  categoryId: text('category_id').references(() => productCategories.id),
  available: boolean('available').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  deliveryType: text('delivery_type').notNull(), // 'pickup' | 'delivery'
  deliveryAddress: text('delivery_address'),
  notes: text('notes'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('cash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 12, scale: 2 }).notNull(),
});

// Relations
export const businessRelations = relations(businesses, ({ many }) => ({
  products: many(products),
  categories: many(productCategories),
  orders: many(orders),
}));

export const productRelations = relations(products, ({ one }) => ({
  business: one(businesses, { fields: [products.businessId], references: [businesses.id] }),
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  business: one(businesses, { fields: [orders.businessId], references: [businesses.id] }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
