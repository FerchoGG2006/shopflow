import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PATCH /api/kds/orders/[id]  { status: 'preparing' | 'ready' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!['pending', 'preparing', 'ready'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[KDS PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
