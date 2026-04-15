/**
 * kds-orders: Client-side helpers to talk to /api/kds/* endpoints.
 * Orders are now stored in Neon PostgreSQL and streamed via SSE.
 */

export interface KDSOrder {
  id: string;
  businessSlug?: string;
  table: string;
  items: { name: string; qty: number; notes?: string }[];
  status: 'pending' | 'preparing' | 'ready';
  createdAt: number;
  total: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'transfer' | 'online';
}

/** Publish a new order to Neon via the API. Called at checkout. */
export async function publishOrder(
  order: Omit<KDSOrder, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const res = await fetch('/api/kds/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(await res.text());
  const { id } = await res.json();
  return id;
}

/** Fetch the initial order list for a business slug. */
export async function fetchOrders(slug: string): Promise<KDSOrder[]> {
  const res = await fetch(`/api/kds/orders?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return [];
  return res.json();
}

/** Update an order's status. Called by the chef on the KDS. */
export async function updateOrderStatus(
  id: string,
  status: KDSOrder['status']
): Promise<void> {
  await fetch(`/api/kds/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

/** Open a real-time SSE stream. Returns a cleanup function. */
export function subscribeToOrders(
  slug: string,
  onOrder: (order: KDSOrder) => void,
  onConnected?: () => void
): () => void {
  const es = new EventSource(`/api/kds/stream?slug=${encodeURIComponent(slug)}`);

  es.addEventListener('order', (e: MessageEvent) => {
    try {
      const order: KDSOrder = JSON.parse(e.data);
      onOrder(order);
    } catch {}
  });

  es.addEventListener('connected', () => {
    onConnected?.();
  });

  es.onerror = () => {
    // EventSource auto-reconnects on error
  };

  return () => es.close();
}

/** @deprecated Use publishOrder (async) instead. Kept for backward compat. */
export function ordersHash(): string { return ''; }
/** @deprecated */
export function getOrders(): KDSOrder[] { return []; }
