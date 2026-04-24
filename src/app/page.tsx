'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { IconBuilding, IconLock, IconId, IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    if (token) router.push('/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.login(nik, password);
      if (res.success && res.token && res.employee) {
        authService.setToken(res.token);
        authService.setUserData(res.employee);
        router.push('/dashboard');
      } else {
        setError(res.message || 'NIK atau Password salah.');
      }
    } catch {
      setError('Terjadi kesalahan koneksi. Pastikan server API berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#f8fafc' }}>

      {/* LEFT — Branding panel */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        background: 'linear-gradient(160deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <IconBuilding size={40} color="#ffffff" stroke={1.5} />
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
            Portal Karyawan
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', marginBottom: '40px' }}>
            CV. Makmur Permata<br />
            Sistem Manajemen Karyawan
          </p>

          {/* Feature highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            {[
              { icon: '📋', label: 'Presensi dengan verifikasi wajah & GPS' },
              { icon: '💰', label: 'Akses slip gaji & data pinjaman' },
              { icon: '📅', label: 'Pengajuan izin & cuti online' },
              { icon: '🪪', label: 'ID Card digital terverifikasi' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{f.icon}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Selamat Datang</h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Masukkan NIK dan Password untuk masuk ke portal</p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{ padding: '12px 16px', marginBottom: '24px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* NIK field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="nik" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>NIK Karyawan</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <IconId size={18} color="#94a3b8" />
                </div>
                <input
                  id="nik"
                  type="text"
                  placeholder="Masukkan NIK Anda"
                  value={nik}
                  onChange={e => setNik(e.target.value)}
                  required
                  autoComplete="username"
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 16px 0 42px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#1f2937',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1565c0')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <IconLock size={18} color="#94a3b8" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 44px 0 42px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#1f2937',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1565c0')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: '50px',
                marginTop: '8px',
                border: 'none',
                borderRadius: '10px',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #1565c0, #0d47a1)',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(21,101,192,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}
            >
              {isLoading ? <><IconLoader2 size={18} className="animate-spin" /> Sedang masuk...</> : 'Masuk ke Portal'}
            </button>
          </form>

          <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Hubungi HRD jika Anda lupa password atau mengalami kendala akses.
          </p>
        </div>
      </div>
    </div>
  );
}
