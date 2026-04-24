'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconChartBar,
  IconFilter,
  IconLoader2,
  IconCalendar,
  IconUsers,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { authService, AttendanceHistory } from '@/services/auth.service';

const bulanNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getStatusMeta(item: AttendanceHistory): { color: string; label: string } {
  if (item.status === 'i') return { color: '#8b5cf6', label: 'Izin' };
  if (item.status === 's') return { color: '#ec4899', label: 'Sakit' };
  if (item.status === 'c') return { color: '#06b6d4', label: 'Cuti' };
  if (item.terlambat_min > 0) return { color: '#ef4444', label: `Telat ${item.terlambat_min}m` };
  if (item.pulang_cepat_min > 0) return { color: '#f59e0b', label: 'Pulang Cepat' };
  return { color: '#22c55e', label: 'Hadir' };
}

function isSpecialStatus(status: AttendanceHistory['status']): boolean {
  return status === 'i' || status === 's' || status === 'c';
}

export default function LaporanPage() {
  const router = useRouter();
  const now = new Date();
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(now.getFullYear());
  const [data, setData] = useState<AttendanceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    authService
      .getAttendanceHistory(token, bulan, tahun)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setData(res.data);
        } else {
          setError('Gagal memuat data presensi.');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.';
        if (msg.includes('401')) {
          authService.clearToken();
          router.push('/');
          return;
        }
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [bulan, tahun, router]);

  /* ───── computed stats ───── */
  const totalHadir = data.filter((d) => d.status === 'h' && d.terlambat_min === 0 && d.pulang_cepat_min === 0).length;
  const totalIzinSakitCuti = data.filter((d) => d.status === 'i' || d.status === 's' || d.status === 'c').length;
  const totalTerlambat = data.filter((d) => d.terlambat_min > 0).length;
  const totalPulangCepat = data.filter((d) => d.pulang_cepat_min > 0).length;

  /* ───── stat card definition ───── */
  const stats = [
    { label: 'Total Hadir', value: totalHadir, color: '#22c55e', bg: '#f0fdf4', icon: <IconUsers size={20} color="#22c55e" /> },
    { label: 'Izin / Sakit / Cuti', value: totalIzinSakitCuti, color: '#3b82f6', bg: '#eff6ff', icon: <IconCalendar size={20} color="#3b82f6" /> },
    { label: 'Total Terlambat', value: totalTerlambat, color: '#ef4444', bg: '#fef2f2', icon: <IconAlertTriangle size={20} color="#ef4444" /> },
    { label: 'Pulang Cepat', value: totalPulangCepat, color: '#f59e0b', bg: '#fffbeb', icon: <IconChartBar size={20} color="#f59e0b" /> },
  ];

  /* ───── years range ───── */
  const years = [2024, 2025, 2026];

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Laporan Absensi
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Rekap kehadiran — {bulanNames[bulan - 1]} {tahun}
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconFilter size={18} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Filter Periode</span>
        </div>

        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1e293b',
            background: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {bulanNames.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>{name}</option>
          ))}
        </select>

        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1e293b',
            background: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Attendance table ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: 0 }}>
            Riwayat Presensi — {bulanNames[bulan - 1]} {tahun}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconLoader2 size={28} color="#1565c0" className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat data presensi...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconAlertTriangle size={28} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>{error}</p>
            <button
              onClick={() => { setError(null); setIsLoading(true); }}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1565c0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconCalendar size={28} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Tidak ada data presensi untuk bulan ini.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Tanggal', 'Hari', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const meta = getStatusMeta(item);
                const special = isSpecialStatus(item.status);
                const dateObj = new Date(item.tanggal);
                const tanggalStr = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                      {tanggalStr}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b' }}>
                      {item.hari}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 500 }}>
                      {special ? '—' : (item.jam_in || '—')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 500 }}>
                      {special ? '—' : (item.jam_out || '—')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: meta.color,
                          background: meta.color + '15',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {item.keterangan || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
