'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  table: string;
  items: { name: string; qty: number; notes?: string }[];
  status: 'pending' | 'preparing' | 'ready';
  time: string;
  total: number;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1024',
    table: 'Mesa 5',
    items: [
      { name: 'Hamburguesa Bonanza', qty: 2, notes: 'Sin cebolla en una' },
      { name: 'Papas Rusticas', qty: 1 },
      { name: 'Coca-Cola Zero', qty: 2 }
    ],
    status: 'pending',
    time: '2 min ago',
    total: 85000
  },
  {
    id: '1023',
    table: 'Mesa 2',
    items: [
      { name: 'Pizza Pepperoni XL', qty: 1 },
      { name: 'Cerveza Club Colombia', qty: 3 }
    ],
    status: 'preparing',
    time: '12 min ago',
    total: 120000
  }
];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  const updateStatus = (id: string, newStatus: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const filteredOrders = orders.filter(o => activeTab === 'all' || o.status === activeTab);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* KDS Header */}
      <header style={{
        padding: '20px 30px',
        background: '#141414',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{
            background: '#ff4b2b',
            width: 45, height: 45,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(255,75,43,0.3)'
          }}>
            <ChefHat size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>KITCHEN DISPLAY SYSTEM</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>Sincronización en tiempo real activa</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {['all', 'pending', 'preparing', 'ready'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: activeTab === tab ? '#333' : 'transparent',
                color: activeTab === tab ? '#fff' : '#888',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Order Grid */}
      <main style={{ padding: 30, flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25, alignContent: 'start' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100, color: '#444' }}>
            <ChefHat size={60} style={{ marginBottom: 20, opacity: 0.2 }} />
            <div style={{ fontSize: 18 }}>No hay pedidos en esta sección</div>
          </div>
        ) : filteredOrders.map(order => (
          <div key={order.id} style={{
            background: '#1a1a1a',
            borderRadius: 20,
            border: `1px solid ${order.status === 'pending' ? '#ff4b2b40' : '#333'}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '16px 20px',
              background: order.status === 'pending' ? 'linear-gradient(90deg, #ff4b2b20, transparent)' : '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #333'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#ff4b2b' }}>#{order.id}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>{order.table}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12 }}>
                <Clock size={14} />
                <span>{order.time}</span>
              </div>
            </div>

            <div style={{ padding: 20, flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      minWidth: 28, height: 28,
                      background: '#333',
                      borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#fff'
                    }}>
                      {item.qty}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: 12, color: '#ff4b2b', marginTop: 4, fontStyle: 'italic' }}>
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 15, background: '#121212', borderTop: '1px solid #333', display: 'flex', gap: 10 }}>
              {order.status === 'pending' && (
                <button
                  onClick={() => updateStatus(order.id, 'preparing')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, background: '#ff4b2b',
                    color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <ChefHat size={16} /> COMENZAR PREPARACIÓN
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateStatus(order.id, 'ready')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, background: '#4ade80',
                    color: '#000', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <CheckCircle size={16} /> MARCADO COMO LISTO
                </button>
              )}
              {order.status === 'ready' && (
                <div style={{
                  flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(74,222,128,0.1)',
                  color: '#4ade80', textAlign: 'center', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <CheckCircle size={16} /> COMPLETADO
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
