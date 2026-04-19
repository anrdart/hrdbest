'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, Employee, AttendanceSummary } from '@/services/auth.service';
import { IconLogout, IconClock, IconLogin, IconLogout2, IconFileText, IconHourglass, IconClockHour4, IconTrophy, IconChecklist, IconNews, IconCash, IconHome, IconFingerprint, IconLayoutGrid, IconCircleCheck, IconCircleX, IconAlertCircle, IconPill, IconBeach, IconId, IconWallet, IconLoader2 } from '@tabler/icons-react';
import Swal from 'sweetalert2';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('beranda');
  const [clock, setClock] = useState<Date | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live clock
  useEffect(() => {
    setIsMounted(true);
    setClock(new Date());
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    const userData = authService.getUserData();

    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async (authToken: string) => {
      try {
        if (userData) {
          setUser(userData);
        } else {
          const profileResponse = await authService.getProfile(authToken);
          if (profileResponse.success) {
            setUser(profileResponse.data);
            authService.setUserData(profileResponse.data);
          }
        }

        const historyResponse = await authService.getAttendanceHistory(authToken);
        if (historyResponse.success) {
          setHistory(historyResponse.data);
        }

        const summaryResponse = await authService.getAttendanceSummary(authToken);
        if (summaryResponse.success) {
          setSummary(summaryResponse.data);
        }

        const todayResponse = await authService.getAttendanceToday(authToken);
        if (todayResponse.success) {
          setTodayAttendance(todayResponse.data);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        if (error.message && error.message.includes('401')) {
          authService.clearToken();
          router.push('/');
        }
      } finally {
        setIsHistoryLoading(false);
        setIsLoading(false);
      }
    };

    fetchData(token);
  }, [router]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar Aplikasi?',
      text: "Anda perlu login kembali untuk mengakses data presensi.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1565c0',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (result.isConfirmed) {
      setIsLoggingOut(true);
      const token = authService.getToken();
      
      try {
        if (token) {
          await authService.logout(token);
        }
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        authService.clearToken();
        router.replace('/');
        setIsLoggingOut(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#ffffff' }}>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  const now = clock || new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateStr = isMounted ? `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}` : '--, -- --- ----';
  const timeStr = isMounted && clock ? `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}:${String(clock.getSeconds()).padStart(2, '0')}` : '--:--:--';

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '-- : --';
    try {
      const date = new Date(time);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (e) {
      return '-- : --';
    }
  };

  return (
    <>
        {/* ====== BLUE HEADER ====== */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)',
            padding: '20px 20px 50px',
            position: 'relative',
          }}
        >

          {/* User info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                border: '2px solid rgba(255,255,255,0.4)',
              }}
            >
              {user?.nama_karyawan?.[0] || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{user?.nama_karyawan || 'User'}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                {user?.nik} • {user?.nama_jabatan || 'Staff'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 10px',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 20
              }}
            >
              {isLoggingOut ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : (
                <IconLogout size={18} stroke={2} />
              )}
            </button>
          </div>

          {/* Digital Clock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
            <span style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '3px',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'inherit',
              textShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}>
              {timeStr}
            </span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginTop: '-2px' }}>
              Hari ini : {dateStr}
            </span>
          </div>
        </div>

        {/* ====== ATTENDANCE CARD ====== */}
        <div
          style={{
            margin: '-36px 16px 0',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '16px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Jam Masuk / Jam Pulang */}
          <div style={{ display: 'flex', alignItems: 'center', borderRadius: '16px', padding: '16px 0' }}>
            {/* Jam Masuk */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLogin size={22} color="#1565c0" stroke={2} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>Jam Masuk</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: todayAttendance?.cek?.jam_in ? '#1f2937' : '#9ca3af', letterSpacing: '2px' }}>
                  {formatTime(todayAttendance?.cek?.jam_in)}
                </p>
              </div>
            </div>
            {/* Divider */}
            <div style={{ width: '1px', height: '40px', background: '#e5e7eb', margin: '0 8px' }} />
            {/* Jam Pulang */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLogout2 size={22} color="#1565c0" stroke={2} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937' }}>Jam Pulang</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: todayAttendance?.cek?.jam_out ? '#1f2937' : '#9ca3af', letterSpacing: '2px' }}>
                  {formatTime(todayAttendance?.cek?.jam_out)}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly recap */}
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937', textAlign: 'center', marginBottom: '8px' }}>Rekap Absensi Bulan ini</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Hadir', value: `${summary?.hadir || 0} Hari`, color: '#22c55e' },
              { label: 'Izin', value: `${summary?.izin || 0} Hari`, color: '#3b82f6' },
              { label: 'Sisa Cuti', value: `${summary?.sisa_cuti || 0} kali`, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: item.color }}>{item.value}</p>
                <div style={{ height: '3px', borderRadius: '2px', background: item.color, marginTop: '6px', opacity: 0.7 }} />
              </div>
            ))}
          </div>
        </div>

        {/* ====== MENU UTAMA ====== */}
        <div style={{ padding: '0 16px', flex: 1, marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Izin', icon: <IconFileText size={24} color="#4f46e5" stroke={1.8} />, bg: '#e0e7ff' },
              { label: 'ID Card', icon: <IconId size={24} color="#d97706" stroke={1.8} />, bg: '#fef3c7' },
              { label: 'Slip Gaji', icon: <IconCash size={24} color="#2563eb" stroke={1.8} />, bg: '#dbeafe' },
              { label: 'Pinjaman', icon: <IconWallet size={24} color="#db2777" stroke={1.8} />, bg: '#fce7f3' },
            ].map((menu) => (
              <div
                key={menu.label}
                onClick={() => {
                  if (menu.label === 'Izin') router.push('/izin');
                  if (menu.label === 'ID Card') router.push('/id-card');
                  if (menu.label === 'Slip Gaji') router.push('/slip-gaji');
                  if (menu.label === 'Pinjaman') router.push('/pinjaman');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: menu.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {menu.icon}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563' }}>{menu.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ====== RIWAYAT PRESENSI ====== */}
        <div style={{ padding: '24px 16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937' }}>Riwayat Presensi</h3>
            <button onClick={() => router.push('/history')} style={{ fontSize: '12px', fontWeight: 700, color: '#1565c0', background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Semua</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isHistoryLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Memuat data...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Belum ada data presensi.</div>
            ) : (
              history.map((item, idx) => {
                let statusColor = '#22c55e';
                let isSpecialStatus = false;
                let statusLabel = item.keterangan || 'Hadir';

                // Map status codes to colors
                if (item.status === 'h') {
                  if (item.terlambat_min > 0) {
                    statusColor = '#ef4444';
                    statusLabel = `Telat ${item.terlambat_min}m`;
                  } else if (item.pulang_cepat_min > 0) {
                    statusColor = '#f59e0b';
                    statusLabel = 'Pulang Cepat';
                  } else {
                    statusColor = '#22c55e';
                    statusLabel = 'Tepat Waktu';
                  }
                } else if (item.status === 'i') {
                  statusColor = '#8b5cf6';
                  statusLabel = 'Izin';
                  isSpecialStatus = true;
                } else if (item.status === 's') {
                  statusColor = '#ec4899';
                  statusLabel = 'Sakit';
                  isSpecialStatus = true;
                } else if (item.status === 'c') {
                  statusColor = '#06b6d4';
                  statusLabel = 'Cuti';
                  isSpecialStatus = true;
                }

                const dayNameShort = item.hari?.substring(0, 3).toUpperCase() || '---';
                const dateNumber = item.tanggal?.split('-')[2] || '--';
                const formattedDate = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : item.tanggal;

                return (
                  <div
                    key={idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${statusColor}`,
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Left Date Box */}
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: statusColor + '10', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${statusColor}20`
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: statusColor }}>{dayNameShort}</span>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: statusColor, lineHeight: 1 }}>{dateNumber}</span>
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{formattedDate}</h4>
                        <div style={{ 
                          background: '#f1f5f9', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          fontSize: '8px', 
                          fontWeight: 700, 
                          color: '#64748b',
                        }}>
                          NON SHIFT
                        </div>
                      </div>

                      {!isSpecialStatus ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                              {item.jam_in || '--:--'} - {item.jam_out || '--:--'}
                            </span>
                            <div style={{ 
                              marginLeft: 'auto',
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: statusColor,
                            }}>
                              {statusLabel}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {item.denda > 0 && (
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                                Rp {item.denda.toLocaleString('id-ID')}
                              </div>
                            )}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>
                              PJ: 7.00 Jam
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: '2px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: statusColor }}>
                            {item.keterangan || `${statusLabel} (Keperluan Pribadi)`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
    </>
  );
}
