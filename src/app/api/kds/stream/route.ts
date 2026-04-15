import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { orders, businesses } from '@/db/schema';
import { eq, desc, gt } from 'drizzle-orm';

// GET /api/kds/stream?slug=xxx
// Server-Sent Events: pushes new orders to the KDS client in real time.
// Polls the DB every 2 seconds and emits 'order' events for new entries.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    return new Response('slug required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      // Resolve businessId
      const biz = await db.select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.slug, slug))
        .limit(1);

      if (!biz.length) {
        send('error', { message: 'Business not found' });
        controller.close();
        return;
      }

      const businessId = biz[0].id;
      let lastCheck = Date.now();

      // Emit keepalive immediately
      send('connected', { slug });

      const poll = async () => {
        try {
          const cutoff = new Date(lastCheck - 100); // 100ms overlap to avoid gaps
          lastCheck = Date.now();

          const newOrders = await db.select()
            .from(orders)
            .where(eq(orders.businessId, businessId))
            .orderBy(desc(orders.createdAt))
            .limit(20);

          // Only send orders created after our last check
          const fresh = newOrders.filter(o => 
            o.createdAt && o.createdAt.getTime() > cutoff.getTime()
          );

          for (const o of fresh) {
            const payload = {
              id: o.id,
              table: o.customerName,
              items: (() => { try { return JSON.parse(o.notes || '[]'); } catch { return []; } })(),
              status: o.status,
              createdAt: o.createdAt?.getTime() ?? Date.now(),
              total: parseFloat(o.total?.toString() ?? '0'),
              deliveryType: o.deliveryType,
              deliveryAddress: o.deliveryAddress,
              paymentMethod: o.paymentMethod,
            };
            send('order', payload);
          }

          // Heartbeat every 2 cycles
          send('ping', { ts: Date.now() });
        } catch (err) {
          console.error('[SSE poll]', err);
        }
      };

      // Poll every 2 seconds
      const interval = setInterval(poll, 2000);

      // Clean up when the client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
