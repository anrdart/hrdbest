'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      router.push('/dashboard');
    }

    // PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [router]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login(nik, password);

      if (response.success && response.token && response.employee) {
        authService.setToken(response.token);
        authService.setUserData(response.employee);
        router.push('/dashboard');
      } else {
        setError(response.message || 'NIK atau Password salah.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi. Pastikan server API berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="layout-wrapper">
      <div className="mobile-container" style={{ alignItems: 'center', padding: '0 32px' }}>

        {/* Logo Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '80px',
            marginBottom: '40px',
          }}
        >
          <img 
            src="/images/logo-mp.png" 
            alt="Logo" 
            style={{ width: '130px', height: '130px', objectFit: 'contain' }} 
          />
        </div>

        {/* Heading */}
        <div style={{ width: '100%', marginBottom: '28px' }}>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '4px',
            }}
          >
            Login to your Account
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Silakan masukkan NIK dan Password Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '20px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="nik" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', paddingLeft: '4px' }}>NIK</label>
            <input
              id="nik"
              type="text"
              placeholder="00.00.000"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: '100%',
                height: '54px',
                padding: '0 20px',
                border: '1.5px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '15px',
                color: '#1f2937',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: '#374151', paddingLeft: '4px' }}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                height: '54px',
                padding: '0 20px',
                border: '1.5px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '15px',
                color: '#1f2937',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            id="sign-in-btn"
            style={{
              width: '100%',
              height: '54px',
              marginTop: '12px',
              border: 'none',
              borderRadius: '14px',
              background: '#1a237e',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.3px',
              boxShadow: '0 4px 16px rgba(26,35,126,0.3)',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <p
          style={{
            margin: '36px 0 28px',
            fontSize: '13px',
            color: '#9ca3af',
            fontWeight: 500,
          }}
        >
          - Or sign in with -
        </p>

        {/* Floating PWA Install Button */}
        {showInstallPrompt && (
          <div 
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 64px)',
              maxWidth: '350px',
              background: '#ffffff',
              padding: '12px 16px',
              borderRadius: '20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              zIndex: 1000,
              animation: 'slideUp 0.5s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#e8eaf6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/logo-mp.png" alt="Portal" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#1a237e' }}>Pasang Aplikasi Portal</p>
                <p style={{ fontSize: '11px', margin: 0, color: '#6b7280' }}>Akses cepat & hemat kuota</p>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              style={{
                background: '#1a237e',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Install
            </button>
          </div>
        )}

        <style jsx global>{`
          @keyframes slideUp {
            from { transform: translate(-50%, 100px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>

        {/* Social Buttons */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {['Google', 'Facebook', 'Twitter'].map((s) => (
            <button
              key={s}
              type="button"
              aria-label={s}
              style={{
                width: '72px',
                height: '54px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '14px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {s === 'Google' && (
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.03 24.03 0 000 21.56l7.98-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              {s === 'Facebook' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {s === 'Twitter' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DA1F2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: 'auto',
            paddingTop: '40px',
            paddingBottom: '40px',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            style={{
              color: '#1a237e',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
