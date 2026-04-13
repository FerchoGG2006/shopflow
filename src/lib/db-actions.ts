'use server';

import { db } from '@/lib/db';
import { businesses, products, orders, orderItems, productCategories } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Business, Product, ProductCategory, Order, CartItem } from '@/types';

// ─── Business ───────────────────────────────────────────────────────────────

export async function getBusinessById(id: string): Promise<Business | null> {
  const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  if (result.length === 0) return null;
  const b = result[0];
  return { ...b, description: b.description || '', logoUrl: b.logoUrl || '', bannerUrl: b.bannerUrl || '', plan: b.plan as any } as Business;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const result = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  if (result.length === 0) return null;
  const b = result[0];
  return { ...b, description: b.description || '', logoUrl: b.logoUrl || '', bannerUrl: b.bannerUrl || '', plan: b.plan as any } as Business;
}

export async function createBusiness(data: any): Promise<void> {
  await db.insert(businesses).values({
    id: data.ownerId, // Matching the Firebase pattern
    slug: data.slug,
    name: data.name,
    category: data.category,
    ownerId: data.ownerId,
    description: data.description,
    whatsappNumber: data.whatsappNumber,
    currency: data.currency,
    accentColor: data.accentColor,
    plan: 'free',
    active: true,
  });
}

export async function updateBusiness(id: string, data: Partial<Business>): Promise<void> {
  await db.update(businesses).set(data as any).where(eq(businesses.id, id));
}

// ─── Products & Categories ──────────────────────────────────────────────────

export async function getCategories(businessId: string): Promise<ProductCategory[]> {
  const results = await db.select().from(productCategories)
    .where(eq(productCategories.businessId, businessId))
    .orderBy(productCategories.order);
  return results as ProductCategory[];
}

export async function getAllProducts(businessId: string): Promise<Product[]> {
  const results = await db.select().from(products)
    .where(eq(products.businessId, businessId))
    .orderBy(products.order);
  
  return results.map((p: any) => ({
    ...p,
    description: p.description || '',
    imageUrl: p.imageUrl || '',
    categoryId: p.categoryId || undefined,
    price: parseFloat(p.price)
  })) as Product[];
}

export async function getProducts(businessId: string): Promise<Product[]> {
  return getAllProducts(businessId);
}

export async function createProduct(data: any): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(products).values({
    id,
    businessId: data.businessId,
    name: data.name,
    description: data.description,
    price: data.price.toString(),
    imageUrl: data.imageUrl,
    available: data.available,
    featured: data.featured,
    order: data.order || 0,
    categoryId: data.categoryId,
  });
  return id;
}

export async function updateProduct(id: string, data: any): Promise<void> {
  const updateData = { ...data };
  if (data.price !== undefined) updateData.price = data.price.toString();
  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteProduct(id: string): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function createOrder(data: any): Promise<string> {
  const orderId = crypto.randomUUID();
  
  await db.transaction(async (tx: any) => {
    // Insert order
    await tx.insert(orders).values({
      id: orderId,
      businessId: data.businessId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress,
      notes: data.notes,
      total: data.total.toString(),
      status: 'pending',
      paymentMethod: data.paymentMethod,
    });

    // Insert order items
    for (const item of data.items as CartItem[]) {
      await tx.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId: orderId,
        productId: item.product.id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price.toString(),
      });
    }
  });

  return orderId;
}

export async function getOrders(businessId: string): Promise<Order[]> {
  const results = await db.query.orders.findMany({
    where: eq(orders.businessId, businessId),
    with: {
      items: {
        with: {
          product: true
        }
      }
    },
    orderBy: [desc(orders.createdAt)]
  });

  return results.map((o: any) => ({
    ...o,
    customerPhone: o.customerPhone || '',
    deliveryAddress: o.deliveryAddress || '',
    notes: o.notes || '',
    total: parseFloat(o.total),
    items: o.items.map((i: any) => ({
      product: { ...i.product, price: parseFloat(i.product.price) },
      quantity: i.quantity
    }))
  })) as unknown as Order[];
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
}
