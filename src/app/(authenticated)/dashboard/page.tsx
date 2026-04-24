'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconLogin,
  IconLogout2,
  IconFileText,
  IconCash,
  IconId,
  IconWallet,
  IconFingerprint,
  IconCalendarEvent,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconLoader2,
} from '@tabler/icons-react';
import { authService, Employee, AttendanceSummary } from '@/services/auth.service';
import PushNotificationManager from '@/components/shared/PushNotificationManager';

/* ───── helpers ───── */
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function fmtTime(t: string | null | undefined) {
  return t || '-- : --';
}

function getStatusMeta(item: any) {
  if (item.status === 'i') return { color: '#8b5cf6', label: 'Izin', special: true };
  if (item.status === 's') return { color: '#ec4899', label: 'Sakit', special: true };
  if (item.status === 'c') return { color: '#06b6d4', label: 'Cuti', special: true };
  if (item.terlambat_min > 0) return { color: '#ef4444', label: `Telat ${item.terlambat_min}m`, special: false };
  if (item.pulang_cepat_min > 0) return { color: '#f59e0b', label: 'Pulang Cepat', special: false };
  return { color: '#22c55e', label: 'Tepat Waktu', special: false };
}

/* ───── page ───── */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Employee | null>(null);
  const [role, setRole] = useState<string>(() =>
    typeof window !== 'undefined' ? authService.getRole() : ''
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  // Super Admin specific stats
  const [totalKaryawan, setTotalKaryawan] = useState<number | null>(null);
  const [laporanBulanIni, setLaporanBulanIni] = useState<number | null>(null);
  const [isKaryawanLoading, setIsKaryawanLoading] = useState(false);
  const [isLaporanLoading, setIsLaporanLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setClock(new Date());
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) { router.push('/'); return; }

    const currentRole = authService.getRole();
    if (currentRole) setRole(currentRole);

    (async () => {
      try {
        const userData = authService.getUserData();
        if (userData) {
          setUser(userData);
        } else {
          const p = await authService.getProfile(token);
          if (p.success) { setUser(p.data); authService.setUserData(p.data); }
        }

        if (authService.getRole() !== 'super_admin') {
          const [hist, summ, today] = await Promise.allSettled([
            authService.getAttendanceHistory(token),
            authService.getAttendanceSummary(token),
            authService.getAttendanceToday(token),
          ]);
          if (hist.status === 'fulfilled' && hist.value.success) setHistory(hist.value.data);
          if (summ.status === 'fulfilled' && summ.value.success) setSummary(summ.value.data);
          if (today.status === 'fulfilled' && today.value.success) setTodayAttendance(today.value.data);
        } else {
          // Super Admin: fetch real data for key stats
          const month = new Date().getMonth() + 1;
          const year = new Date().getFullYear();
          try {
            setIsKaryawanLoading(true);
            setIsLaporanLoading(true);
            // Total employees (excluding super_admin)
            const kResp = await fetch('/api/karyawan', {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (kResp.ok) {
              const kData = await kResp.json();
              if (kData?.success && Array.isArray(kData.data)) {
                const total = (kData.data as any[]).filter((u) => u?.role !== 'super_admin').length;
                setTotalKaryawan(total);
              }
            }
            // Laporan Bulan Ini (attendance history for current month/year)
            const hResp = await fetch(`/api/attendance-history?bulan=${month}&tahun=${year}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (hResp.ok) {
              const hData = await hResp.json();
              if (hData?.success && Array.isArray(hData.data)) {
                setLaporanBulanIni(hData.data.length);
              }
            }
          } catch (_err) {
            // Ignore fetch errors for optional stats
          } finally {
            setIsKaryawanLoading(false);
            setIsLaporanLoading(false);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('401')) { authService.clearToken(); router.push('/'); }
      } finally {
        setIsHistoryLoading(false);
        setIsLoading(false);
      }
    })();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <IconLoader2 size={32} color="#1565c0" className="animate-spin" />
      </div>
    );
  }

  const now = clock || new Date();
  const dateStr = isMounted
    ? `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
    : '--, -- --- ----';
  const timeStr = isMounted && clock
    ? `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}:${String(clock.getSeconds()).padStart(2, '0')}`
    : '--:--:--';

  /* ─── Super Admin Dashboard ─── */
  if (role === 'super_admin') {
    return (
      <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
        <PushNotificationManager />

        {/* Page title */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            Selamat Datang, {user?.nama_karyawan?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>{dateStr} — {timeStr}</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Total Karyawan', value: (totalKaryawan !== null && !isKaryawanLoading) ? totalKaryawan.toLocaleString() : (isKaryawanLoading ? '...' : '—'), icon: <IconUsers size={22} color="#1565c0" />, bg: '#eff6ff', accent: '#1565c0' },
            { label: 'Laporan Bulan Ini', value: (laporanBulanIni !== null && !isLaporanLoading) ? laporanBulanIni.toLocaleString() : (isLaporanLoading ? '...' : '—'), icon: <IconChartBar size={22} color="#7c3aed" />, bg: '#f5f3ff', accent: '#7c3aed' },
            { label: 'Sistem', value: 'Aktif', icon: <IconSettings size={22} color="#0891b2" />, bg: '#ecfeff', accent: '#0891b2' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{s.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: s.accent }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Menu Utama</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Manajemen Karyawan', icon: <IconUsers size={24} color="#1565c0" />, bg: '#eff6ff', href: '/karyawan' },
              { label: 'Laporan Absensi', icon: <IconChartBar size={24} color="#7c3aed" />, bg: '#f5f3ff', href: '/laporan' },
              { label: 'Pengaturan', icon: <IconSettings size={24} color="#0891b2" />, bg: '#ecfeff', href: '/pengaturan' },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => router.push(m.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: m.bg,
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {m.icon}
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── HRD / Manager Dashboard ─── */
  const quickMenu = [
    { label: 'Pengajuan Izin', icon: <IconFileText size={22} color="#4f46e5" />, bg: '#e0e7ff', href: '/izin' },
    { label: 'ID Card', icon: <IconId size={22} color="#d97706" />, bg: '#fef3c7', href: '/id-card' },
    { label: 'Slip Gaji', icon: <IconCash size={22} color="#2563eb" />, bg: '#dbeafe', href: '/slip-gaji' },
    { label: 'Pinjaman', icon: <IconWallet size={22} color="#db2777" />, bg: '#fce7f3', href: '/pinjaman' },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }}>
      <PushNotificationManager />

      {/* Page header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
            Selamat Datang, {user?.nama_karyawan?.split(' ')[0] || 'Karyawan'} 👋
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            {user?.nik} &bull; {user?.nama_jabatan || 'Staff'} &bull; {user?.nama_cabang || ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '2px', fontVariantNumeric: 'tabular-nums' }}>
            {timeStr}
          </p>
          <p style={{ fontSize: '12px', color: '#64748b' }}>{dateStr}</p>
        </div>
      </div>

      {/* Two-column main area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Attendance summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { label: 'Hadir Bulan Ini', value: `${summary?.hadir ?? '—'} hari`, color: '#22c55e', bg: '#f0fdf4', icon: <IconCircleCheck size={20} color="#22c55e" /> },
              { label: 'Izin / Sakit / Cuti', value: `${summary?.izin ?? '—'} hari`, color: '#3b82f6', bg: '#eff6ff', icon: <IconFileText size={20} color="#3b82f6" /> },
              { label: 'Sisa Cuti', value: `${summary?.sisa_cuti ?? '—'} kali`, color: '#f59e0b', bg: '#fffbeb', icon: <IconAlertCircle size={20} color="#f59e0b" /> },
            ].map((s) => (
              <div
                key={s.label}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{s.label}</p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent attendance table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Riwayat Presensi Terkini</h2>
              <button
                onClick={() => router.push('/history')}
                style={{ fontSize: '12px', fontWeight: 600, color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Lihat Semua →
              </button>
            </div>

            {isHistoryLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Memuat data...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data presensi bulan ini.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status', 'Denda'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((item, idx) => {
                    const { color, label, special } = getStatusMeta(item);
                    const fmtDate = item.tanggal
                      ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : item.tanggal;
                    return (
                      <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                          {item.hari?.substring(0, 3)}, {fmtDate}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 500 }}>
                          {special ? '—' : (item.jam_in || '—')}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: special ? '#94a3b8' : '#1e293b', fontWeight: 500 }}>
                          {special ? '—' : (item.jam_out || '—')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color, background: color + '15', padding: '3px 8px', borderRadius: '6px' }}>
                            {label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: item.denda > 0 ? '#ef4444' : '#94a3b8', fontWeight: item.denda > 0 ? 700 : 400 }}>
                          {item.denda > 0 ? `Rp ${item.denda.toLocaleString('id-ID')}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Today check-in/out card */}
          <div style={{ background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', borderRadius: '16px', padding: '24px', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <IconClock size={18} color="rgba(255,255,255,0.8)" />
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Presensi Hari Ini</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <IconLogin size={14} color="rgba(255,255,255,0.7)" />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Masuk</p>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px', color: todayAttendance?.cek?.jam_in ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
                  {fmtTime(todayAttendance?.cek?.jam_in)}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <IconLogout2 size={14} color="rgba(255,255,255,0.7)" />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Pulang</p>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '1px', color: todayAttendance?.cek?.jam_out ? '#ffffff' : 'rgba(255,255,255,0.4)' }}>
                  {fmtTime(todayAttendance?.cek?.jam_out)}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/attendance')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'background 0.15s',
              }}
            >
              <IconFingerprint size={16} />
              {todayAttendance?.cek?.jam_in
                ? todayAttendance?.cek?.jam_out
                  ? 'Presensi Lengkap ✓'
                  : 'Absen Pulang'
                : 'Absen Masuk'}
            </button>
          </div>

          {/* Quick menu */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Akses Cepat</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {quickMenu.map((m) => (
                <button
                  key={m.label}
                  onClick={() => router.push(m.href)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 8px',
                    background: m.bg,
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {m.icon}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shift info */}
          {todayAttendance?.jam_kerja && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Jadwal Hari Ini</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Jam Kerja</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    {todayAttendance.jam_kerja.jam_masuk} – {todayAttendance.jam_kerja.jam_pulang}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Jadwal</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                    {todayAttendance.jadwal?.nama_jadwal || '—'}
                  </span>
                </div>
                {todayAttendance.status_wfh && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    WFH Hari Ini
                  </span>
                )}
                {todayAttendance.status_libur && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    Hari Libur
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
