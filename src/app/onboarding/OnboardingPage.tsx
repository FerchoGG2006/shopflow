'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Store, Palette, Phone, Globe, Sparkles } from 'lucide-react';
import { onAuth } from '@/lib/auth';
import { uploadImage } from '@/lib/firebase';
import { createBusiness } from '@/lib/db-actions';
import { Business, BusinessCategory } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  // Step 1 — Negocio
  name: string;
  category: BusinessCategory;
  description: string;
  // Step 2 — Contacto
  whatsappNumber: string;
  currency: string;
  // Step 3 — Diseño
  accentColor: string;
  // Step 4 — URL
  slug: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: BusinessCategory; label: string; emoji: string; desc: string }[] = [
  { value: 'restaurant', label: 'Restaurante / Comida', emoji: '🍽️', desc: 'Menú con platos y combos' },
  { value: 'jewelry',    label: 'Joyería',              emoji: '💎', desc: 'Anillos, collares, pulseras' },
  { value: 'clothing',   label: 'Ropa y textiles',      emoji: '👗', desc: 'Prendas, telas, accesorios' },
  { value: 'electronics',label: 'Electrónicos',         emoji: '📱', desc: 'Celulares, gadgets, tecnología' },
  { value: 'bakery',     label: 'Panadería / Pastelería',emoji: '🥐', desc: 'Pan, tortas, postres' },
  { value: 'cosmetics',  label: 'Cosméticos y belleza',  emoji: '💄', desc: 'Maquillaje, skincare, perfumes' },
  { value: 'other',      label: 'Otro negocio',          emoji: '🛍️', desc: 'Cualquier producto o servicio' },
];

const CURRENCIES = [
  { value: 'COP', label: 'Peso colombiano', flag: '🇨🇴' },
  { value: 'MXN', label: 'Peso mexicano',   flag: '🇲🇽' },
  { value: 'USD', label: 'Dólar americano', flag: '🇺🇸' },
  { value: 'ARS', label: 'Peso argentino',  flag: '🇦🇷' },
  { value: 'PEN', label: 'Sol peruano',     flag: '🇵🇪' },
  { value: 'CLP', label: 'Peso chileno',    flag: '🇨🇱' },
  { value: 'EUR', label: 'Euro',            flag: '🇪🇺' },
];

const ACCENT_COLORS = [
  { value: '#E84545', name: 'Rojo pasión' },
  { value: '#E8821A', name: 'Naranja energía' },
  { value: '#1D9E75', name: 'Verde fresco' },
  { value: '#185FA5', name: 'Azul confianza' },
  { value: '#7F77DD', name: 'Violeta creativo' },
  { value: '#D4537E', name: 'Rosa elegante' },
  { value: '#1A1915', name: 'Negro premium' },
  { value: '#BA7517', name: 'Dorado exclusivo' },
];

const STEPS = [
  { label: 'Tu negocio',  icon: <Store size={16} /> },
  { label: 'Contacto',    icon: <Phone size={16} /> },
  { label: 'Diseño',      icon: <Palette size={16} /> },
  { label: 'Tu link',     icon: <Globe size={16} /> },
];

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: OnboardingData; onChange: (k: keyof OnboardingData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <FieldLabel>Nombre de tu negocio *</FieldLabel>
        <input
          type="text"
          placeholder="Ej: Joyería Valentina, Restaurante El Fogón..."
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = data.accentColor)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      <div>
        <FieldLabel>¿Qué tipo de negocio tienes? *</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => onChange('category', cat.value)}
              style={{
                padding: '14px 16px',
                border: `2px solid ${data.category === cat.value ? data.accentColor : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                background: data.category === cat.value ? `${data.accentColor}10` : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.emoji}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: data.category === cat.value ? data.accentColor : 'var(--text-primary)', lineHeight: 1.3 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Descripción breve (opcional)</FieldLabel>
        <textarea
          placeholder="Ej: Los mejores tacos de la ciudad, desde 1998..."
          value={data.description}
          onChange={e => onChange('description', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => (e.currentTarget.style.borderColor = data.accentColor)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>
    </div>
  );
}

function Step2({ data, onChange }: { data: OnboardingData; onChange: (k: keyof OnboardingData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <FieldLabel>Número de WhatsApp *</FieldLabel>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          Incluye el código de país. Los pedidos llegarán a este número.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            padding: '12px 14px',
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)', fontSize: 15,
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            +
          </div>
          <input
            type="tel"
            placeholder="57 300 123 4567"
            value={data.whatsappNumber}
            onChange={e => onChange('whatsappNumber', e.target.value.replace(/[^0-9]/g, ''))}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => (e.currentTarget.style.borderColor = data.accentColor)}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Ejemplo Colombia: 573001234567 · México: 5215512345678
        </p>
      </div>

      <div>
        <FieldLabel>Moneda *</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CURRENCIES.map(c => (
            <button
              key={c.value}
              onClick={() => onChange('currency', c.value)}
              style={{
                padding: '12px 14px',
                border: `2px solid ${data.currency === c.value ? data.accentColor : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                background: data.currency === c.value ? `${data.accentColor}10` : '#fff',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20 }}>{c.flag}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: data.currency === c.value ? data.accentColor : 'var(--text-primary)' }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange }: { data: OnboardingData; onChange: (k: keyof OnboardingData, v: string) => void }) {
  const cat = CATEGORIES.find(c => c.value === data.category);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <FieldLabel>Color principal de tu tienda</FieldLabel>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Este color aparecerá en los botones, precios y detalles de tu tienda.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onChange('accentColor', c.value)}
              style={{
                padding: '12px 8px',
                border: `2px solid ${data.accentColor === c.value ? c.value : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: c.value, margin: '0 auto 6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {data.accentColor === c.value && <Check size={16} color="#fff" />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div>
        <FieldLabel>Vista previa de tu tienda</FieldLabel>
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: '#fff',
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Fake banner */}
          <div style={{ height: 80, background: `linear-gradient(135deg, ${data.accentColor}30, ${data.accentColor}50)`, position: 'relative' }} />
          <div style={{ padding: '0 20px 20px' }}>
            {/* Logo placeholder */}
            <div style={{
              width: 56, height: 56,
              background: '#fff',
              border: '3px solid #fff',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              marginTop: -28, marginBottom: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>
              {cat?.emoji || '🏪'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
              {data.name || 'Nombre de tu negocio'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, marginBottom: 16 }}>
              {data.description || 'La descripción de tu negocio aparecerá aquí'}
            </div>
            {/* Fake product card */}
            <div style={{
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Producto ejemplo</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: data.accentColor, marginTop: 2 }}>
                  {data.currency === 'COP' ? '$25.000' : data.currency === 'MXN' ? '$120' : '$12'}
                </div>
              </div>
              <div style={{
                background: data.accentColor, color: '#fff',
                padding: '8px 14px', borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              }}>
                + Agregar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4({ data, onChange, userId }: { data: OnboardingData; onChange: (k: keyof OnboardingData, v: string) => void; userId: string }) {
  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 40);
  }

  const suggested = generateSlug(data.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <FieldLabel>Tu link único *</FieldLabel>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Este es el link que compartirás en redes sociales, WhatsApp, o imprimirás en tu local.
        </p>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {[suggested, `${suggested}-oficial`, `tienda-${suggested}`].filter(Boolean).map(s => (
            <button
              key={s}
              onClick={() => onChange('slug', s)}
              style={{
                padding: '6px 12px',
                background: data.slug === s ? `${data.accentColor}15` : 'var(--surface-2)',
                border: `1.5px solid ${data.slug === s ? data.accentColor : 'var(--border)'}`,
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: data.slug === s ? data.accentColor : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: '#fff',
          transition: 'border-color 0.15s',
        }}>
          <div style={{
            padding: '12px 14px',
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            fontFamily: 'var(--font-body)', fontSize: 14,
            color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            shopflow.app/
          </div>
          <input
            type="text"
            placeholder={suggested || 'mi-negocio'}
            value={data.slug}
            onChange={e => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              color: 'var(--text-primary)', padding: '12px 14px',
              background: 'transparent',
            }}
          />
        </div>

        {data.slug && (
          <div style={{
            marginTop: 10, padding: '10px 14px',
            background: '#F0FFF6', border: '1px solid #9FE1CB',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: '#0F6E56',
          }}>
            <Check size={15} />
            Tu tienda quedará en: <strong>shopflow.app/{data.slug}</strong>
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
          Resumen de tu negocio
        </div>
        {[
          { label: 'Nombre', value: data.name },
          { label: 'Categoría', value: CATEGORIES.find(c => c.value === data.category)?.label },
          { label: 'WhatsApp', value: `+${data.whatsappNumber}` },
          { label: 'Moneda', value: data.currency },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', padding: '11px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 100, flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{row.value || '—'}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 100, flexShrink: 0 }}>Color</span>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: data.accentColor }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{ACCENT_COLORS.find(c => c.value === data.accentColor)?.name}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]   = useState(0);
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name: '', category: 'restaurant', description: '',
    whatsappNumber: '', currency: 'COP',
    accentColor: '#E84545', slug: '',
  });

  useEffect(() => {
    const unsub = onAuth((user: any) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.uid);
    });
    return () => unsub();
  }, [router]);

  function update(key: keyof OnboardingData, value: string) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  const canProceed = [
    data.name.trim().length > 0 && !!data.category,
    data.whatsappNumber.length >= 8 && !!data.currency,
    !!data.accentColor,
    data.slug.length >= 3,
  ][step];

  async function handleFinish() {
    if (!userId || !canProceed) return;
    setSaving(true);
    try {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await createBusiness({
        slug,
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category,
        whatsappNumber: data.whatsappNumber,
        currency: data.currency,
        accentColor: data.accentColor,
        ownerId: userId,
        plan: 'free',
        active: true,
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al crear tu tienda. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 64,
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px',
        gap: 16,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: data.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, transition: 'background 0.3s' }}>🏪</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17 }}>ShopFlow</span>
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: i < step ? `${data.accentColor}15` : i === step ? data.accentColor : 'var(--surface-2)',
                color: i < step ? data.accentColor : i === step ? '#fff' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                transition: 'all 0.3s',
              }}>
                {i < step ? <Check size={14} /> : s.icon}
                <span style={{ display: step === i ? 'block' : 'none' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 20, height: 1, background: i < step ? data.accentColor : 'var(--border)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px' }}>
        <div style={{ width: '100%', maxWidth: 580 }}>

          {/* Step header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${data.accentColor}12`,
              border: `1px solid ${data.accentColor}30`,
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              color: data.accentColor,
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              letterSpacing: '0.06em',
              marginBottom: 16,
              transition: 'all 0.3s',
            }}>
              <Sparkles size={13} />
              PASO {step + 1} DE {STEPS.length}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>
              {[
                'Cuéntanos sobre tu negocio',
                'Información de contacto',
                'Personaliza tu tienda',
                'Tu link único',
              ][step]}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
              {[
                'Esta información aparecerá en tu tienda pública.',
                'Los pedidos llegarán directamente a tu WhatsApp.',
                'Elige el color que representa tu marca.',
                'Listo. Tu tienda estará en este link para siempre.',
              ][step]}
            </p>
          </div>

          {/* Step content */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '32px 32px' }}>
            {step === 0 && <Step1 data={data} onChange={update} />}
            {step === 1 && <Step2 data={data} onChange={update} />}
            {step === 2 && <Step3 data={data} onChange={update} />}
            {step === 3 && <Step4 data={data} onChange={update} userId={userId} />}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '14px 20px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <ArrowLeft size={17} /> Atrás
              </button>
            )}
            <button
              onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
              disabled={!canProceed || saving}
              style={{
                flex: 1, padding: '14px',
                background: !canProceed || saving ? 'var(--border)' : data.accentColor,
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                cursor: !canProceed || saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.3s, opacity 0.15s',
              }}
              onMouseEnter={e => { if (canProceed && !saving) (e.currentTarget.style.opacity = '0.9'); }}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {saving ? (
                <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : isLast ? (
                <>
                  <Sparkles size={18} />
                  Crear mi tienda gratis
                </>
              ) : (
                <>Siguiente <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)', fontSize: 15,
  color: 'var(--text-primary)', background: '#fff',
  outline: 'none', transition: 'border-color 0.15s',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 13, fontWeight: 500,
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-display)',
      display: 'block', marginBottom: 8,
      letterSpacing: '0.01em',
    }}>
      {children}
    </label>
  );
}
