'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChefHat, Clock, CheckCircle, Bell, Wifi, WifiOff } from 'lucide-react';
import { fetchOrders, updateOrderStatus, subscribeToOrders, KDSOrder } from '@/lib/kds-orders';

// ─── Bell Sound (Web Audio API) ───────────────────────────────────────────

function playBell() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[880, 0, 0.6, 0.8], [1100, 0.1, 0.4, 0.9]].forEach(([freq, delay, gain, stop]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, ctx.currentTime + stop);
      g.gain.setValueAtTime(gain, ctx.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + stop);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + stop);
    });
  } catch {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const STATUS = {
  pending:   { label: 'NUEVO',         color: '#ff4b2b', bg: '#ff4b2b15', ring: '#ff4b2b40' },
  preparing: { label: 'EN PREPARACIÓN', color: '#facc15', bg: '#facc1510', ring: '#facc1530' },
  ready:     { label: 'LISTO',          color: '#4ade80', bg: '#4ade8010', ring: '#4ade8030' },
};

// ─── Order Card ──────────────────────────────────────────────────────────

function OrderCard({ order, onStatusChange, isNew }: {
  order: KDSOrder;
  onStatusChange: (id: string, s: KDSOrder['status']) => void;
  isNew: boolean;
}) {
  const cfg = STATUS[order.status as keyof typeof STATUS] ?? STATUS.pending;
  const [elapsed, setElapsed] = useState(timeAgo(order.createdAt));

  useEffect(() => {
    const t = setInterval(() => setElapsed(timeAgo(order.createdAt)), 1000);
    return () => clearInterval(t);
  }, [order.createdAt]);

  return (
    <div style={{
      background: '#1a1a1a', borderRadius: 20,
      border: `1px solid ${cfg.ring}`, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: isNew ? `0 0 40px ${cfg.color}50, 0 10px 30px rgba(0,0,0,0.5)` : '0 10px 30px rgba(0,0,0,0.5)',
      animation: isNew ? 'slideInCard 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' : undefined,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${cfg.ring}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: cfg.color }}>#{order.id.slice(-4)}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#eee' }}>{order.table}</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: cfg.color, color: '#000', fontWeight: 800, letterSpacing: '0.05em',
          }}>{cfg.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#777', fontSize: 12 }}>
          <Clock size={13} /><span style={{ fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '16px 18px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 30, height: 30, background: '#2a2a2a', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: cfg.color, flexShrink: 0,
              }}>{item.qty}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{item.name}</div>
                {item.notes && (
                  <div style={{
                    fontSize: 11, color: '#ff4b2b', marginTop: 3, fontStyle: 'italic',
                    background: '#ff4b2b10', padding: '2px 6px', borderRadius: 4, display: 'inline-block',
                  }}>⚠️ {item.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #252525', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#555' }}>
            {order.deliveryType === 'pickup' ? '🏃 Recoger' : `🛵 ${order.deliveryAddress || 'Domicilio'}`}
          </span>
          <span style={{ fontSize: 11, color: '#555' }}>
            {order.paymentMethod === 'cash' ? '💵 Efectivo' : order.paymentMethod === 'transfer' ? '📱 Transferencia' : '💳 Online'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 14px', background: '#111', borderTop: '1px solid #222' }}>
        {order.status === 'pending' && (
          <button onClick={() => onStatusChange(order.id, 'preparing')} style={{
            width: '100%', padding: 13, borderRadius: 12, background: '#ff4b2b',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <ChefHat size={16} /> COMENZAR PREPARACIÓN
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={() => onStatusChange(order.id, 'ready')} style={{
            width: '100%', padding: 13, borderRadius: 12, background: '#4ade80',
            color: '#000', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <CheckCircle size={16} /> MARCAR COMO LISTO
          </button>
        )}
        {order.status === 'ready' && (
          <div style={{
            width: '100%', padding: 13, borderRadius: 12,
            background: '#4ade8015', color: '#4ade80', textAlign: 'center',
            fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <CheckCircle size={16} /> COMPLETADO
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KDS Main ────────────────────────────────────────────────────────────

const SLUG = 'bonanza-2020'; // TODO: make dynamic via searchParam

export default function KitchenPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [bellEnabled, setBellEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const knownIds = useRef<Set<string>>(new Set());

  const addOrder = useCallback((o: KDSOrder) => {
    if (knownIds.current.has(o.id)) return;
    knownIds.current.add(o.id);
    setOrders(prev => [o, ...prev]);
    if (o.status === 'pending') {
      if (bellEnabled) playBell();
      setNewIds(prev => new Set([...prev, o.id]));
      setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(o.id); return n; }), 4000);
    }
  }, [bellEnabled]);

  // Load initial orders + subscribe to SSE stream
  useEffect(() => {
    fetchOrders(SLUG).then(list => {
      list.forEach(o => knownIds.current.add(o.id));
      setOrders(list);
    });

    const unsub = subscribeToOrders(SLUG, addOrder, () => setConnected(true));
    return unsub;
  }, [addOrder]);

  async function handleStatusChange(id: string, status: KDSOrder['status']) {
    await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  const tabs = ['all', 'pending', 'preparing', 'ready'] as const;
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  };
  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px', background: '#141414', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #ff4b2b, #ff8c00)', width: 46, height: 46,
            borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(255,75,43,0.4)',
          }}>
            <ChefHat size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>
              KITCHEN DISPLAY — <span style={{ color: '#ff4b2b' }}>{SLUG}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
              {connected
                ? <><Wifi size={11} color="#4ade80" /><span style={{ fontSize: 11, color: '#4ade80' }}>En vivo · Neon PostgreSQL</span></>
                : <><WifiOff size={11} color="#f87171" /><span style={{ fontSize: 11, color: '#f87171' }}>Conectando...</span></>
              }
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => setBellEnabled(b => !b)}
            style={{
              background: bellEnabled ? '#ff4b2b20' : '#1e1e1e',
              border: `1px solid ${bellEnabled ? '#ff4b2b50' : '#333'}`,
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              color: bellEnabled ? '#ff4b2b' : '#555', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <Bell size={15} fill={bellEnabled ? 'currentColor' : 'none'} />
            {bellEnabled ? 'Campana ON' : 'Silenciado'}
          </button>

          <div style={{ display: 'flex', gap: 4, background: '#1a1a1a', padding: 4, borderRadius: 12 }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '7px 13px', borderRadius: 9, border: 'none',
                background: activeTab === tab ? '#2e2e2e' : 'transparent',
                color: activeTab === tab ? '#fff' : '#555',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', position: 'relative',
                transition: 'all 0.15s', textTransform: 'uppercase',
              }}>
                {tab}
                {counts[tab] > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: tab === 'pending' ? '#ff4b2b' : '#333',
                    color: '#fff', borderRadius: 20, fontSize: 9, fontWeight: 900,
                    padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  }}>{counts[tab]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main style={{
        padding: 24, flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20, alignContent: 'start',
      }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#2a2a2a' }}>
            <ChefHat size={52} style={{ marginBottom: 16, opacity: 0.15 }} />
            <div style={{ fontSize: 18, marginBottom: 8 }}>Sin pedidos activos</div>
            <div style={{ fontSize: 13, color: '#333' }}>
              Los pedidos del menú aparecen aquí en tiempo real
            </div>
          </div>
        ) : filtered.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
            isNew={newIds.has(order.id)}
          />
        ))}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.4; }
        }
        @keyframes slideInCard {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.94); }
          60%  { transform: translateY(4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
