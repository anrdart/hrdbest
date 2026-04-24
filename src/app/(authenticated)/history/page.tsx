'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AttendanceHistory } from '@/services/auth.service';
import { IconCalendarEvent, IconLoader2, IconSearch } from '@tabler/icons-react';

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getStatusMeta(item: AttendanceHistory) {
  if (item.status === 'i') return { color: '#8b5cf6', label: 'Izin', special: true };
  if (item.status === 's') return { color: '#ec4899', label: 'Sakit', special: true };
  if (item.status === 'c') return { color: '#06b6d4', label: 'Cuti', special: true };
  if (item.terlambat_min > 0) return { color: '#ef4444', label: `Telat ${item.terlambat_min}m`, special: false };
  if (item.pulang_cepat_min > 0) return { color: '#f59e0b', label: 'Pulang Cepat', special: false };
  return { color: '#22c55e', label: 'Tepat Waktu', special: false };
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const token = authService.getToken();
      if (!token) { router.push('/'); return; }
      try {
        const res = await authService.getAttendanceHistory(token, selectedMonth, selectedYear);
        if (res.success) setHistory(res.data);
      } catch {}
      finally { setIsLoading(false); }
    };
    fetchHistory();
  }, [selectedMonth, selectedYear, router]);

  const filtered = history.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.tanggal?.includes(q) ||
      item.hari?.toLowerCase().includes(q) ||
      item.keterangan?.toLowerCase().includes(q)
    );
  });

  const totalHadir = history.filter(h => h.status === 'h').length;
  const totalIzin = history.filter(h => h.status === 'i').length;
  const totalSakit = history.filter(h => h.status === 's').length;
  const totalCuti = history.filter(h => h.status === 'c').length;
  const totalDenda = history.reduce((a, h) => a + (h.denda || 0), 0);

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Riwayat Presensi</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Rekap kehadiran per periode</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <IconSearch size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px 12px 8px 30px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#0f172a',
                background: '#ffffff',
                outline: 'none',
                width: '160px',
              }}
            />
          </div>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', background: '#ffffff', outline: 'none', cursor: 'pointer' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Hadir', value: totalHadir, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Izin', value: totalIzin, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Sakit', value: totalSakit, color: '#ec4899', bg: '#fdf2f8' },
          { label: 'Cuti', value: totalCuti, color: '#06b6d4', bg: '#ecfeff' },
          { label: 'Total Denda', value: totalDenda > 0 ? `Rp ${totalDenda.toLocaleString('id-ID')}` : '—', color: '#ef4444', bg: '#fff5f5' },
        ].map(s => (
          <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <IconLoader2 size={28} className="animate-spin" color="#1565c0" />
            <p style={{ fontSize: '14px' }}>Memuat data presensi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCalendarEvent size={32} color="#cbd5e1" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tidak Ada Data</p>
              <p style={{ fontSize: '13px' }}>Belum ada data presensi untuk periode ini.</p>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Hari', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Keterangan', 'Denda'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const { color, label, special } = getStatusMeta(item);
                const fmtDate = item.tanggal
                  ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : item.tanggal;
                const dayShort = item.hari?.substring(0, 3) || '---';
                return (
                  <tr
                    key={idx}
                    style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        {dayShort}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {fmtDate}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {special ? '—' : (item.jam_in ? item.jam_in.substring(0, 5) : '—')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {special ? '—' : (item.jam_out ? item.jam_out.substring(0, 5) : '—')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, color, background: color + '15',
                        padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.keterangan || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: item.denda > 0 ? '#ef4444' : '#94a3b8', fontWeight: item.denda > 0 ? 700 : 400 }}>
                      {item.denda > 0 ? `Rp ${item.denda.toLocaleString('id-ID')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && filtered.length > 0 && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
          {filtered.length} dari {history.length} data ditampilkan
        </p>
      )}
    </div>
  );
}
