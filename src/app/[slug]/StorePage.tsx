'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, X, Search, ChevronRight, MapPin, Package, ArrowRight } from 'lucide-react';
import { getBusinessBySlug, getProducts, getCategories } from '@/lib/db-actions';
import { buildWhatsAppMessage, buildWhatsAppURL, formatCurrency, calculateCartTotal, calculateCartCount } from '@/utils/whatsapp';
import { Business, Product, CartItem, ProductCategory } from '@/types';
import MenuBook from '@/components/MenuBook/MenuBook';
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ─── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, #f0ede8 25%, #e8e5e0 50%, #f0ede8 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  currency,
  accentColor,
  onAdd,
  cartQty,
  onIncrease,
  onDecrease,
}: {
  product: Product;
  currency: string;
  accentColor: string;
  onAdd: (p: Product) => void;
  cartQty: number;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--surface-2)', flexShrink: 0 }}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, opacity: 0.3,
          }}>
            🛍️
          </div>
        )}
        {product.featured && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: accentColor, color: '#fff',
            fontSize: 11, fontWeight: 600, padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.04em',
          }}>
            DESTACADO
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {product.name}
        </div>
        {product.description && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
            {product.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: accentColor }}>
            {formatCurrency(product.price, currency)}
          </span>

          {cartQty === 0 ? (
            <button
              onClick={() => onAdd(product)}
              style={{
                background: accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '8px 14px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus size={14} />
              Agregar
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 6px',
            }}>
              <button onClick={() => onDecrease(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--text-primary)' }}>
                <Minus size={14} />
              </button>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{cartQty}</span>
              <button onClick={() => onIncrease(product.id)} style={{ background: accentColor, border: 'none', cursor: 'pointer', padding: 4, borderRadius: '50%', display: 'flex', color: '#fff' }}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

function CartDrawer({
  items,
  business,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  items: CartItem[];
  business: Business;
  onClose: () => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [name, setName] = useState('');
  const [delivery, setDelivery] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState<'cash' | 'transfer' | 'online'>('cash');
  const [notes, setNotes] = useState('');

  const total = calculateCartTotal(items);

  function handleSendOrder() {
    if (!name.trim()) return;
    const message = buildWhatsAppMessage({
      business,
      items,
      customerName: name.trim(),
      deliveryType: delivery,
      deliveryAddress: delivery === 'delivery' ? address : undefined,
      paymentMethod: payment,
      notes: notes.trim() || undefined,
    });
    const url = buildWhatsAppURL(business.whatsappNumber, message);
    window.open(url, '_blank');
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'var(--font-display)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)', zIndex: 100,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 'min(440px, 100vw)',
        background: '#fff',
        zIndex: 101,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
              {step === 'cart' ? 'Tu pedido' : 'Tus datos'}
            </div>
            {step === 'cart' && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {step === 'cart' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.product.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
                }}>
                  {item.product.imageUrl ? (
                    <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <Image src={item.product.imageUrl} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="56px" />
                    </div>
                  ) : (
                    <div style={{ width: 56, height: 56, background: 'var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🛍️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.product.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatCurrency(item.product.price, business.currency)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => onDecrease(item.product.id)} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => onIncrease(item.product.id)} style={{ background: business.accentColor, border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Tu nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: María García"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              <div>
                <label style={labelStyle}>Tipo de entrega</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['pickup', 'delivery'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setDelivery(type)}
                      style={{
                        padding: '12px',
                        border: `2px solid ${delivery === type ? business.accentColor : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        background: delivery === type ? `${business.accentColor}10` : '#fff',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: 13,
                        color: delivery === type ? business.accentColor : 'var(--text-secondary)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s',
                      }}
                    >
                      {type === 'pickup' ? <Package size={18} /> : <MapPin size={18} />}
                      {type === 'pickup' ? 'Recoger' : 'Domicilio'}
                    </button>
                  ))}
                </div>
              </div>

              {delivery === 'delivery' && (
                <div>
                  <label style={labelStyle}>Dirección de entrega</label>
                  <input
                    type="text"
                    placeholder="Calle y número, barrio..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>Método de pago</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { value: 'cash', label: '💵 Efectivo' },
                    { value: 'transfer', label: '🏦 Transferencia bancaria' },
                    { value: 'online', label: '💳 Pago en línea' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPayment(opt.value as typeof payment)}
                      style={{
                        padding: '12px 16px',
                        border: `2px solid ${payment === opt.value ? business.accentColor : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        background: payment === opt.value ? `${business.accentColor}10` : '#fff',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        fontWeight: payment === opt.value ? 500 : 400,
                        fontSize: 14,
                        color: payment === opt.value ? business.accentColor : 'var(--text-primary)',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notas adicionales (opcional)</label>
                <textarea
                  placeholder="Alergias, preferencias, instrucciones especiales..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: business.accentColor }}>
              {formatCurrency(total, business.currency)}
            </span>
          </div>

          {step === 'cart' ? (
            <button
              onClick={() => setStep('checkout')}
              style={{
                width: '100%',
                padding: '14px',
                background: business.accentColor,
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Continuar <ChevronRight size={18} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('cart')}
                style={{
                  padding: '14px 20px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Atrás
              </button>
              <button
                onClick={handleSendOrder}
                disabled={!name.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: name.trim() ? '#25D366' : 'var(--border)',
                  color: name.trim() ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Pedir por WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Store Page ──────────────────────────────────────────────────────────

export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'book'>('book');

  useEffect(() => {
    async function load() {
      try {
        const biz = await getBusinessBySlug(slug);
        if (!biz) { setNotFound(true); return; }
        setBusiness(biz);
        const [prods, cats] = await Promise.all([getProducts(biz.id), getCategories(biz.id)]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (activeCategory) {
      list = list.filter(p => p.categoryId === activeCategory);
    }
    return list;
  }, [products, search, activeCategory]);

  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach(item => { map[item.product.id] = item.quantity; });
    return map;
  }, [cartItems]);

  function addToCart(product: Product) {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function increaseQty(productId: string) {
    setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i));
  }

  function decreaseQty(productId: string) {
    setCartItems(prev => {
      const updated = prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      return updated.filter(i => i.quantity > 0);
    });
  }

  function removeItem(productId: string) {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  }

  const cartCount = calculateCartCount(cartItems);
  const cartTotal = calculateCartTotal(cartItems);

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-primary)' }}>Tienda no encontrada</h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No existe ninguna tienda con este enlace.</p>
    </div>
  );

  const accentColor = business?.accentColor || '#E84545';

  return (
    <div style={{ minHeight: '100vh', background: viewMode === 'book' ? '#000' : 'var(--bg)', paddingBottom: cartCount > 0 ? 100 : 40 }}>

      {/* ── View Switcher ── */}
      {!loading && !notFound && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          display: 'flex', gap: 8, background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)', padding: 4, borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: viewMode === 'grid' ? accentColor : 'transparent',
              color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
              fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
            }}
          >
            Cuadrícula
          </button>
          <button
            onClick={() => setViewMode('book')}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: viewMode === 'book' ? accentColor : 'transparent',
              color: viewMode === 'book' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
              fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
            }}
          >
            Modo Carta 📖
          </button>
        </div>
      )}

      {viewMode === 'book' && business ? (
        <MenuBook
          business={business}
          products={products}
          categories={categories}
          onAddToCart={addToCart}
          cartCount={cartCount}
          onOpenCart={() => setCartOpen(true)}
          totalAmount={cartTotal}
        />
      ) : (
        <>
          {/* ── Header / Banner ── */}
      {loading ? (
        <div style={{ height: 200, background: 'var(--surface-2)' }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
      ) : (
        <div style={{
          position: 'relative',
          height: 200,
          background: business?.bannerUrl ? 'transparent' : `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`,
          overflow: 'hidden',
        }}>
          {business?.bannerUrl && (
            <Image src={business.bannerUrl} alt="banner" fill style={{ objectFit: 'cover' }} priority sizes="100vw" />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4))',
          }} />
        </div>
      )}

      {/* ── Business Info ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 16,
          marginTop: -48, marginBottom: 20, position: 'relative', zIndex: 2,
        }}>
          {loading ? (
            <Skeleton style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 'var(--radius-lg)',
              background: '#fff', border: '3px solid #fff',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              {business?.logoUrl ? (
                <Image src={business.logoUrl} alt="logo" width={80} height={80} style={{ objectFit: 'cover' }} />
              ) : '🏪'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            {loading ? (
              <>
                <Skeleton style={{ width: 180, height: 22, marginBottom: 8 }} />
                <Skeleton style={{ width: 120, height: 16 }} />
              </>
            ) : (
              <>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {business?.name}
                </h1>
                {business?.description && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{business.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{
          position: 'relative', marginBottom: 20,
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: '#fff', display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 10,
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: 14,
              color: 'var(--text-primary)', padding: '12px 0',
              background: 'transparent',
            }}
          />
        </div>

        {/* ── Category Filter ── */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap',
                border: `2px solid ${activeCategory === null ? accentColor : 'var(--border)'}`,
                background: activeCategory === null ? accentColor : '#fff',
                color: activeCategory === null ? '#fff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              Todo
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap',
                  border: `2px solid ${activeCategory === cat.id ? accentColor : 'var(--border)'}`,
                  background: activeCategory === cat.id ? accentColor : '#fff',
                  color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Products Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <Skeleton style={{ height: 160, borderRadius: 0 }} />
                <div style={{ padding: 14 }}>
                  <Skeleton style={{ height: 18, width: '80%', marginBottom: 8 }} />
                  <Skeleton style={{ height: 14, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>No se encontraron productos</p>
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}
          >
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                currency={business!.currency}
                accentColor={accentColor}
                onAdd={addToCart}
                cartQty={cartQtyMap[product.id] || 0}
                onIncrease={increaseQty}
                onDecrease={decreaseQty}
              />
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* ── Floating Cart Button ── */}
      {cartCount > 0 && viewMode === 'grid' && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50,
        }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '16px 28px',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: `0 8px 32px ${accentColor}60`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <ShoppingCart size={20} />
            <span>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
            <span style={{ opacity: 0.8 }}>•</span>
            <span>{formatCurrency(cartTotal, business?.currency || 'COP')}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && business && (
        <CartDrawer
          items={cartItems}
          business={business}
          onClose={() => setCartOpen(false)}
          onIncrease={increaseQty}
          onDecrease={decreaseQty}
          onRemove={removeItem}
        />
      )}

      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
