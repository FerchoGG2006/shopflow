'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuth } from '@/lib/auth';
import { getBusinessById } from '@/lib/db-actions';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuth(async (user: any) => {
      if (!user) {
        router.push('/login');
        return;
      }
      const biz: any = await getBusinessById(user.uid);
      router.push(biz ? '/dashboard' : '/onboarding');
    });
    return () => unsub();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border)',
        borderTopColor: '#E84545',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
