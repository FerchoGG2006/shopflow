'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { register, loginWithGoogle, getAuthErrorMessage } from '@/lib/auth';
import { getBusinessById } from '@/lib/db-actions';

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-display)',
  display: 'block', marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)', fontSize: 15,
  color: 'var(--text-primary)', background: '#fff',
  outline: 'none', transition: 'border-color 0.15s',
};

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Al menos 6 caracteres', ok: password.length >= 6 },
    { label: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      {checks.map(c => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.ok ? '#1A9E5A' : 'var(--text-muted)' }}>
          <Check size={12} style={{ opacity: c.ok ? 1 : 0.3 }} />
          {c.label}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      router.push('/onboarding');
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

  const valid = name.trim() && email && password.length >= 6;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>

      {/* ── Left — brand ── */}
      <div style={{
        background: '#1A1915',
        display: 'flex', flexDirection: 'column',
        padding: '48px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 450, height: 450, borderRadius: '50%', border: '1px solid rgba(232,69,69,0.12)' }} />
        <div style={{ position: 'absolute', top: '20%', left: -80, width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E84545', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏪</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>ShopFlow</span>
        </div>

        {/* Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
            Empieza a vender<br />
            <span style={{ color: '#E84545' }}>en 10 minutos.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, maxWidth: 340 }}>
            Sin conocimientos técnicos. Sin tarjeta de crédito. Solo tu negocio y tus clientes.
          </p>

          {/* Benefits */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Catálogo visual con fotos y precios',
              'Pedidos automáticos por WhatsApp',
              'Dashboard para gestionar todo',
              'IA que escribe descripciones por ti',
              'QR code para tu local o empaque',
            ].map(benefit => (
              <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(232,69,69,0.2)',
                  border: '1px solid rgba(232,69,69,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Check size={12} color="#E84545" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Plan badge */}
          <div style={{
            marginTop: 40, padding: '16px 20px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ color: '#E84545', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              PLAN GRATIS — SIEMPRE
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Hasta 30 productos · pedidos ilimitados por WhatsApp · sin comisiones
            </div>
          </div>
        </div>
      </div>

      {/* ── Right — form ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        background: 'var(--bg)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
            Crea tu cuenta gratis
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: '#E84545', textDecoration: 'none', fontWeight: 500 }}>
              Iniciar sesión
            </Link>
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            style={{
              width: '100%', padding: '13px',
              background: '#fff', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15,
              color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 22,
              boxShadow: 'var(--shadow-sm)',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget.style.boxShadow = 'var(--shadow-md)'); (e.currentTarget.style.borderColor = 'var(--border-strong)'); }}
            onMouseLeave={e => { (e.currentTarget.style.boxShadow = 'var(--shadow-sm)'); (e.currentTarget.style.borderColor = 'var(--border)'); }}
          >
            {googleLoad
              ? <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: '#E84545', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Continuar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>o con correo</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: '#FCEBEB', border: '1px solid #F09595',
              borderRadius: 'var(--radius-md)', marginBottom: 18,
              fontSize: 14, color: '#A32D2D',
              animation: 'fadeIn 0.2s ease',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Tu nombre completo</label>
              <input
                type="text" placeholder="Ej: Carlos Martínez"
                value={name} onChange={e => setName(e.target.value)} required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#E84545')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email" placeholder="tu@correo.com"
                value={email} onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#E84545')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#E84545')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit" disabled={loading || !valid}
              style={{
                padding: '14px',
                background: loading || !valid ? 'var(--border)' : '#E84545',
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                cursor: loading || !valid ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { if (valid && !loading) (e.currentTarget.style.opacity = '0.9'); }}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {loading
                ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <>Crear cuenta gratis <ArrowRight size={18} /></>
              }
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              Al registrarte aceptas nuestros{' '}
              <Link href="/terms" style={{ color: 'var(--text-secondary)' }}>Términos de uso</Link>
              {' '}y{' '}
              <Link href="/privacy" style={{ color: 'var(--text-secondary)' }}>Política de privacidad</Link>.
            </p>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
          div[style*="1A1915"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
