'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Wand2, ArrowLeft, ImagePlus, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, uploadImage } from '@/lib/firebase';
import { getBusinessById, getAllProducts, createProduct, updateProduct, deleteProduct } from '@/lib/db-actions';
import { Business, Product } from '@/types';
import { generateProductDescription } from '@/lib/ai';
import { formatCurrency } from '@/utils/whatsapp';

const CURRENCIES = ['COP', 'MXN', 'USD', 'EUR', 'PEN', 'ARS', 'CLP'];

function ProductForm({
  business,
  initial,
  onSave,
  onCancel,
}: {
  business: Business;
  initial?: Product;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initial?.imageUrl || '');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleGenerateDescription() {
    if (!name.trim()) return;
    setGenerating(true);
    try {
      const desc = await generateProductDescription({
        productName: name,
        price: parseFloat(price) || 0,
        currency: business.currency,
        category: business.category,
        businessName: business.name,
      });
      setDescription(desc);
    } catch {
      alert('No se pudo generar la descripción. Verifica tu clave de API.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);
    try {
      let imageUrl = initial?.imageUrl || '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, `products/${business.id}/${Date.now()}_${imageFile.name}`);
      }
      await onSave({
        businessId: business.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        imageUrl,
        available,
        featured,
        order: initial?.order ?? 999,
        categoryId: initial?.categoryId,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)', fontSize: 14,
    color: 'var(--text-primary)', background: '#fff', outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Image Upload */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Imagen del producto
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', height: 180,
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--surface-2)',
          transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = business.accentColor)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {imagePreview ? (
            <Image src={imagePreview} alt="preview" fill style={{ objectFit: 'cover' }} sizes="400px" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <ImagePlus size={28} />
              <span style={{ fontSize: 13 }}>Haz clic para subir imagen</span>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        </label>
      </div>

      {/* Name */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Nombre del producto *
        </label>
        <input
          type="text"
          required
          placeholder="Ej: Collar de plata 925"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Description */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Descripción
          </label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={!name.trim() || generating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: generating ? 'var(--surface-2)' : `${business.accentColor}15`,
              color: generating ? 'var(--text-muted)' : business.accentColor,
              border: 'none', borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              cursor: name.trim() && !generating ? 'pointer' : 'not-allowed',
            }}
          >
            <Wand2 size={13} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
            {generating ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>
        <textarea
          placeholder="Describe tu producto para que los clientes se enamoren..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Price */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Precio ({business.currency}) *
        </label>
        <input
          type="number"
          required
          min="0"
          step="any"
          placeholder="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = business.accentColor)}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Disponible', value: available, onChange: setAvailable, icon: available ? <ToggleRight size={22} /> : <ToggleLeft size={22} /> },
          { label: 'Destacado', value: featured, onChange: setFeatured, icon: <Star size={16} fill={featured ? 'currentColor' : 'none'} /> },
        ].map(toggle => (
          <button
            key={toggle.label}
            type="button"
            onClick={() => toggle.onChange(!toggle.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px',
              background: toggle.value ? `${business.accentColor}12` : 'var(--surface-2)',
              border: `1.5px solid ${toggle.value ? business.accentColor : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              color: toggle.value ? business.accentColor : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {toggle.icon}
            {toggle.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 20px',
            background: 'var(--surface-2)',
            color: 'var(--text-primary)',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim() || !price}
          style={{
            flex: 1, padding: '12px',
            background: saving || !name.trim() || !price ? 'var(--border)' : business.accentColor,
            color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { router.push('/login'); return; }
      const biz = await getBusinessById(user.uid);
      if (!biz) { router.push('/onboarding'); return; }
      setBusiness(biz);
      const prods = await getAllProducts(biz.id);
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function handleSave(data: Omit<Product, 'id' | 'createdAt'>) {
    if (editProduct) {
      await updateProduct(editProduct.id, data);
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...data } : p));
    } else {
      const id = await createProduct(data);
      setProducts(prev => [...prev, { id, ...data, createdAt: new Date() }]);
    }
    setShowForm(false);
    setEditProduct(null);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    await deleteProduct(product.id);
    setProducts(prev => prev.filter(p => p.id !== product.id));
  }

  async function handleToggleAvailable(product: Product) {
    const updated = { ...product, available: !product.available };
    await updateProduct(product.id, { available: updated.available });
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
  }

  if (loading || !business) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: business?.accentColor || '#E84545', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const accent = business.accentColor;

  if (showForm || editProduct) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 20px', maxWidth: 600, margin: '0 auto' }}>
        <button
          onClick={() => { setShowForm(false); setEditProduct(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          Volver a productos
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 28 }}>
          {editProduct ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 28px' }}>
          <ProductForm
            business={business}
            initial={editProduct || undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditProduct(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, flex: 1 }}>
          Productos <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 18 }}>({products.length})</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 188px',
            background: accent, color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Sin productos aún</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Agrega tu primer producto para que los clientes puedan pedirlo.</p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px', background: accent, color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Crear primer producto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: product.available ? 1 : 0.6,
                transition: 'all 0.15s',
              }}
            >
              {/* Image */}
              <div style={{
                width: 60, height: 60, borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)', overflow: 'hidden',
                flexShrink: 0, position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {product.imageUrl
                  ? <Image src={product.imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="60px" />
                  : '🛍️'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{product.name}</span>
                  {product.featured && <Star size={14} style={{ color: '#C47A1A' }} fill="#C47A1A" />}
                </div>
                {product.description && (
                  <span style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                    maxWidth: 300,
                  }}>
                    {product.description}
                  </span>
                )}
              </div>

              {/* Price */}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: accent, flexShrink: 0 }}>
                {formatCurrency(product.price, business.currency)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleAvailable(product)}
                  title={product.available ? 'Ocultar' : 'Mostrar'}
                  style={{
                    padding: '7px', background: 'var(--surface-2)', border: 'none',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    color: product.available ? '#1A9E5A' : 'var(--text-muted)',
                    display: 'flex',
                  }}
                >
                  {product.available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button
                  onClick={() => setEditProduct(product)}
                  style={{ padding: '7px', background: 'var(--surface-2)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  style={{ padding: '7px', background: 'var(--accent-light)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#E84545', display: 'flex' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
