'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Package, TrendingUp, Clock,
  CheckCircle, XCircle, Truck, Bell, ChevronRight,
  BarChart2, Settings, LogOut, QrCode, Store, Plus,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrders, getBusinessById, updateOrderStatus } from '@/lib/db-actions';
import { Order, Business } from '@/types';
import { formatCurrency } from '@/utils/whatsapp';

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius-md)',
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string; next?: Order['status'] }> = {
  pending:   { label: 'Pendiente',   color: '#C47A1A', bg: '#FFFBF0', next: 'confirmed' },
  confirmed: { label: 'Confirmado',  color: '#185FA5', bg: '#E6F1FB', next: 'preparing' },
  preparing: { label: 'Preparando',  color: '#7F77DD', bg: '#EEEDFE', next: 'ready' },
  ready:     { label: 'Listo',       color: '#1A9E5A', bg: '#F0FFF6', next: 'delivered' },
  delivered: { label: 'Entregado',   color: '#5F5E5A', bg: '#F1EFE8' },
  cancelled: { label: 'Cancelado',   color: '#C53030', bg: '#FCEBEB' },
};

function OrderCard({ order, currency, accentColor, onUpdateStatus }: {
  order: Order;
  currency: string;
  accentColor: string;
  onUpdateStatus: (id: string, status: Order['status']) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const createdAt = order.createdAt instanceof Date ? order.createdAt : (order.createdAt as any).toDate?.() || new Date();

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
            {order.customerName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {createdAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · {createdAt.toLocaleDateString('es')}
          </div>
        </div>
        <span style={{
          background: cfg.bg, color: cfg.color,
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)',
          letterSpacing: '0.04em',
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>{item.quantity}× {item.product.name}</span>
            <span>{formatCurrency(item.product.price * item.quantity, currency)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: accentColor }}>
            {formatCurrency(order.total, currency)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
            {order.deliveryType === 'delivery' ? '🛵 Domicilio' : '🏪 Recoger'}
          </span>
        </div>
        {cfg.next && (
          <button
            onClick={() => onUpdateStatus(order.id, cfg.next!)}
            style={{
              padding: '8px 14px',
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Marcar: {STATUS_CONFIG[cfg.next].label} <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'live' | 'all'>('live');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push('/login'); return; }
      try {
        const biz = await getBusinessById(user.uid);
        if (!biz) { router.push('/onboarding'); return; }
        setBusiness(biz);
        const allOrders = await getOrders(biz.id);
        setOrders(allOrders);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function handleUpdateStatus(id: string, status: Order['status']) {
    await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  if (loading || !business) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: '#E84545', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const accent = business.accentColor;
  const liveOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const todayRevenue = orders
    .filter(o => {
      const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any).toDate?.() || new Date();
      return d.toDateString() === new Date().toDateString() && o.status !== 'cancelled';
    })
    .reduce((s, o) => s + o.total, 0);

  const displayOrders = tab === 'live' ? liveOrders : orders;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '0 8px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {business.logoUrl ? '🏪' : '🏪'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{business.name}</div>
            <a
              href={`/${business.slug}`}
              target="_blank"
              style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}
            >
              Ver tienda →
            </a>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {[
            { icon: <BarChart2 size={17} />, label: 'Dashboard', active: true, action: () => {} },
            { icon: <ShoppingBag size={17} />, label: 'Pedidos', active: false, action: () => {} },
            { icon: <Package size={17} />, label: 'Productos', active: false, action: () => router.push('/dashboard/products') },
            { icon: <Store size={17} />, label: 'Mi tienda', active: false, action: () => router.push('/dashboard/store') },
            { icon: <QrCode size={17} />, label: 'QR Code', active: false, action: () => router.push('/dashboard/qr') },
            { icon: <Settings size={17} />, label: 'Configuración', active: false, action: () => router.push('/dashboard/settings') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: item.active ? `${accent}12` : 'transparent',
                color: item.active ? accent : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: item.active ? 500 : 400,
                fontSize: 14,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget.style.background = 'var(--surface-2)'); }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget.style.background = 'transparent'); }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => auth.signOut().then(() => router.push('/login'))}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'transparent', color: 'var(--text-muted)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14,
            transition: 'color 0.15s',
          }}
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '32px 32px', overflowY: 'auto', maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>Panel de control</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {liveOrders.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: '#FFFBF0', border: '1px solid #C47A1A',
                borderRadius: 'var(--radius-full)',
                fontSize: 13, fontWeight: 500, color: '#C47A1A',
              }}>
                <Bell size={14} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                {liveOrders.length} activos
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard/products')}
              style={{
                padding: '9px 16px',
                background: accent, color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={16} />
              Nuevo producto
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard icon={<ShoppingBag size={20} />} label="Pedidos hoy" value={orders.filter(o => {
            const d = o.createdAt instanceof Date ? o.createdAt : (o.createdAt as any).toDate?.() || new Date();
            return d.toDateString() === new Date().toDateString();
          }).length} color={accent} />
          <StatCard icon={<TrendingUp size={20} />} label="Ventas hoy" value={formatCurrency(todayRevenue, business.currency)} color="#1A9E5A" />
          <StatCard icon={<Clock size={20} />} label="Pendientes" value={liveOrders.length} color="#C47A1A" sub="en proceso ahora" />
          <StatCard icon={<CheckCircle size={20} />} label="Total pedidos" value={orders.length} color="#185FA5" />
        </div>

        {/* Orders */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Pedidos</h2>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius-md)' }}>
              {(['live', 'all'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '6px 14px',
                    background: tab === t ? '#fff' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600, fontSize: 13,
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'live' ? `Activos (${liveOrders.length})` : `Todos (${orders.length})`}
                </button>
              ))}
            </div>
          </div>

          {displayOrders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 6 }}>
                {tab === 'live' ? 'No hay pedidos activos' : 'Aún no tienes pedidos'}
              </p>
              <p style={{ fontSize: 13 }}>
                Comparte tu tienda: <strong>shopflow.app/{business.slug}</strong>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  currency={business.currency}
                  accentColor={accent}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
