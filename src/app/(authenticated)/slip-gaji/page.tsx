'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, SlipMonth } from '@/services/auth.service';
import { IconCalendarEvent, IconFileText, IconChevronRight, IconLoader2 } from '@tabler/icons-react';

const monthColors = [
  { bg: '#eff6ff', accent: '#1565c0' },
  { bg: '#f5f3ff', accent: '#7c3aed' },
  { bg: '#f0fdf4', accent: '#16a34a' },
  { bg: '#fff7ed', accent: '#c2410c' },
  { bg: '#ecfeff', accent: '#0891b2' },
  { bg: '#fdf2f8', accent: '#be185d' },
  { bg: '#fefce8', accent: '#a16207' },
  { bg: '#f0fdf4', accent: '#15803d' },
  { bg: '#eff6ff', accent: '#1d4ed8' },
  { bg: '#fff5f5', accent: '#dc2626' },
  { bg: '#f5f3ff', accent: '#6d28d9' },
  { bg: '#ecfeff', accent: '#0e7490' },
];

export default function SlipGajiPage() {
  const router = useRouter();
  const [months, setMonths] = useState<SlipMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = authService.getToken();
        if (!token) { router.push('/'); return; }
        const res = await authService.getSlipMonths(token);
        if (res.success) setMonths(res.data);
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, [router]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Slip Gaji</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Daftar slip gaji 12 bulan terakhir</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px', color: '#94a3b8' }}>
          <IconLoader2 size={28} className="animate-spin" color="#1565c0" />
          <p style={{ fontSize: '14px' }}>Memuat daftar bulan...</p>
        </div>
      ) : months.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconFileText size={32} color="#cbd5e1" />
          </div>
          <p style={{ fontSize: '14px' }}>Belum ada data slip gaji tersedia.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {months.map((item, idx) => {
            const scheme = monthColors[idx % monthColors.length];
            return (
              <div
                key={`${item.month}-${item.year}`}
                onClick={() => router.push(`/slip-gaji/${item.month}/${item.year}`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{ width: '48px', height: '48px', background: scheme.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconCalendarEvent size={22} color={scheme.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{item.month_name}</p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>{item.year}</p>
                </div>
                <div style={{ width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconChevronRight size={16} color="#94a3b8" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
