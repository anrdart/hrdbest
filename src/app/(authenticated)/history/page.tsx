'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, AttendanceHistory } from '@/services/auth.service';
import { IconArrowLeft, IconCalendarEvent } from '@tabler/icons-react';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const token = authService.getToken();
      if (!token) {
        router.push('/');
        return;
      }
      try {
        const historyResponse = await authService.getAttendanceHistory(token, selectedMonth, selectedYear);
        if (historyResponse.success) {
          setHistory(historyResponse.data);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [selectedMonth, selectedYear, router]);

  return (
    <>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <IconArrowLeft size={20} stroke={2.5} />
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Riwayat Presensi</h1>
        </div>

        {/* Filter Section */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '16px', 
            display: 'flex', 
            gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* History List */}
        <div style={{ padding: '8px 16px 20px', flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%' }}></div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Memuat data presensi...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCalendarEvent size={40} color="#cbd5e1" stroke={1.5} />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tidak Ada Data</p>
                <p style={{ fontSize: '13px' }}>Belum ada data presensi untuk periode ini.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item, idx) => {
                let statusColor = '#22c55e';
                let isSpecialStatus = false;
                let statusLabel = item.keterangan || 'Hadir';

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
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${statusColor}`,
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Left Date Box */}
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      background: statusColor + '10', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${statusColor}20`
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: statusColor }}>{dayNameShort}</span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: statusColor, lineHeight: 1, marginTop: '2px' }}>{dateNumber}</span>
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{formattedDate}</h4>
                        <div style={{ 
                          background: '#f1f5f9', 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          fontSize: '9px', 
                          fontWeight: 800, 
                          color: '#64748b',
                          letterSpacing: '0.5px'
                        }}>
                          NON SHIFT
                        </div>
                      </div>

                      {!isSpecialStatus ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                              {item.jam_in || '--:--'} - {item.jam_out || '--:--'}
                            </span>
                            <div style={{ 
                              marginLeft: 'auto',
                              fontSize: '11px', 
                              fontWeight: 800, 
                              color: statusColor,
                              background: statusColor + '10',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {statusLabel}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {item.denda > 0 && (
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                                Rp {item.denda.toLocaleString('id-ID')}
                              </div>
                            )}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700 }}>
                              PJ: 7.00 Jam
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: '4px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: statusColor }}>
                            {item.keterangan || `${statusLabel} (Keperluan Pribadi)`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </>
  );
}
