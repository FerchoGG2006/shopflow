'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { login, loginWithGoogle, getAuthErrorMessage } from '@/lib/auth';
import { getBusinessById } from '@/lib/db-actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const biz  = await getBusinessById(user.uid);
      router.push(biz ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoad(true);
    try {
      const user = await loginWithGoogle();
      const biz  = await getBusinessById(user.uid);
      router.push(biz ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setGoogleLoad(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font-body)',
    }}>

      {/* ── Left panel — brand ── */}
      <div style={{
        background: '#1A1915',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: -120, left: -80,
          width: 500, height: 500,
          borderRadius: '50%',
          border: '1px solid rgba(232,69,69,0.15)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -40,
          width: 300, height: 300,
          borderRadius: '50%',
          border: '1px solid rgba(232,69,69,0.10)',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: -100,
          width: 400, height: 400,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.04)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#E84545',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🏪</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800, fontSize: 20,
            color: '#fff',
          }}>ShopFlow</span>
        </div>

        {/* Main copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(232,69,69,0.15)',
            border: '1px solid rgba(232,69,69,0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: 12, fontWeight: 600,
            color: '#E84545',
            letterSpacing: '0.06em',
            marginBottom: 24,
            fontFamily: 'var(--font-display)',
          }}>
            PARA NEGOCIOS PEQUEÑOS
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48, fontWeight: 800,
            color: '#fff',
            lineHeight: 1.08,
            marginBottom: 20,
          }}>
            Tu tienda<br />
            <span style={{ color: '#E84545' }}>en un link.</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 16, lineHeight: 1.7,
            maxWidth: 340,
          }}>
            Crea tu catálogo, recibe pedidos por WhatsApp y gestiona todo desde un panel simple.
          </p>

          {/* Social proof */}
          <div style={{
            marginTop: 48,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {[
              { emoji: '🍕', name: 'Pizzería Don Carlos', desc: '+80 pedidos/semana' },
              { emoji: '💎', name: 'Joyería Valentina',  desc: 'Catálogo de 120 piezas' },
              { emoji: '👗', name: 'Boutique Elena',     desc: 'Desde Bogotá para el mundo' },
            ].map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {item.emoji}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{item.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}>
            Bienvenido de vuelta
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 36 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#E84545', textDecoration: 'none', fontWeight: 500 }}>
              Regístrate gratis
            </Link>
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            style={{
              width: '100%',
              padding: '13px',
              background: '#fff',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500, fontSize: 15,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 24,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.borderColor = 'var(--border-strong)');
              (e.currentTarget.style.boxShadow = 'var(--shadow-md)');
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.borderColor = 'var(--border)');
              (e.currentTarget.style.boxShadow = 'var(--shadow-sm)');
            }}
          >
            {googleLoad ? (
              <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: '#E84545', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>o con tu correo</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: '#FCEBEB', border: '1px solid #F09595',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
              fontSize: 14, color: '#A32D2D',
              animation: 'fadeIn 0.2s ease',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={setEmail}
              required
            />

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#E84545')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Link href="/reset-password" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                padding: '14px',
                background: loading || !email || !password ? 'var(--border)' : '#E84545',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 16,
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (!loading && email && password) (e.currentTarget.style.opacity = '0.9'); }}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {loading ? (
                <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <>Entrar <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
          div[style*="1A1915"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-display)',
  display: 'block', marginBottom: 7,
  letterSpacing: '0.01em',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)', fontSize: 15,
  color: 'var(--text-primary)', background: '#fff',
  outline: 'none', transition: 'border-color 0.15s',
};

function Field({
  label, type = 'text', placeholder, value, onChange, required,
}: {
  label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = '#E84545')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  );
}
