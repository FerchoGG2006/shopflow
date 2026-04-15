import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, businesses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// ─── POST /api/kds/orders ─────────────────────────────────────────────────
// Called by the client cart on checkout. Stores the order in Neon.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessSlug,
      customerName,
      items,          // [{ name, qty, notes }]
      total,
      deliveryType,
      deliveryAddress,
      paymentMethod,
    } = body;

    // Resolve businessId from slug
    const biz = await db.select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!biz.length) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const orderId = crypto.randomUUID();

    await db.insert(orders).values({
      id: orderId,
      businessId: biz[0].id,
      customerName,
      deliveryType,
      deliveryAddress: deliveryAddress || null,
      total: total.toString(),
      status: 'pending',
      paymentMethod,
      // We store items as JSON in notes for now (no product id needed for KDS)
      notes: JSON.stringify(items),
    });

    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (err: any) {
    console.error('[KDS POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── GET /api/kds/orders?slug=xxx ─────────────────────────────────────────
// Returns latest orders for a business. Used for initial KDS load.
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug');
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

    const biz = await db.select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!biz.length) return NextResponse.json([], { status: 200 });

    const raw = await db.select()
      .from(orders)
      .where(eq(orders.businessId, biz[0].id))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    const result = raw.map(o => ({
      id: o.id,
      table: o.customerName,
      items: (() => { try { return JSON.parse(o.notes || '[]'); } catch { return []; } })(),
      status: o.status,
      createdAt: o.createdAt?.getTime() ?? Date.now(),
      total: parseFloat(o.total?.toString() ?? '0'),
      deliveryType: o.deliveryType,
      deliveryAddress: o.deliveryAddress,
      paymentMethod: o.paymentMethod,
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[KDS GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
