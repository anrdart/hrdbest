'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, IzinRecord } from '@/services/auth.service';
import {
  IconStethoscope,
  IconMoodEmpty,
  IconBeach,
  IconBriefcase,
  IconLogout,
  IconWalk,
  IconCalendarEvent,
  IconClock,
  IconPlus,
  IconAlertCircle,
  IconLoader2,
} from '@tabler/icons-react';
import IzinSubmissionModal from '@/components/shared/IzinSubmissionModal';

const izinTypes = [
  { type: 'sakit', label: 'Sakit', icon: <IconStethoscope size={18} />, color: '#ef4444', bg: '#fee2e2' },
  { type: 'absen', label: 'Absen', icon: <IconMoodEmpty size={18} />, color: '#f59e0b', bg: '#fef3c7' },
  { type: 'cuti', label: 'Cuti', icon: <IconBeach size={18} />, color: '#3b82f6', bg: '#dbeafe' },
  { type: 'dinas', label: 'Dinas', icon: <IconBriefcase size={18} />, color: '#10b981', bg: '#d1fae5' },
  { type: 'pulang', label: 'Pulang Awal', icon: <IconLogout size={18} />, color: '#8b5cf6', bg: '#ede9fe' },
  { type: 'keluar', label: 'Keluar', icon: <IconWalk size={18} />, color: '#6366f1', bg: '#e0e7ff' },
];

function getStatusMeta(status: any) {
  switch (Number(status)) {
    case 1: return { bg: '#dcfce7', text: '#16a34a', label: 'Disetujui' };
    case 2: return { bg: '#fee2e2', text: '#ef4444', label: 'Ditolak' };
    default: return { bg: '#fef3c7', text: '#d97706', label: 'Pending' };
  }
}

function getIzinMeta(type: string) {
  return izinTypes.find(t => t.type === type.toLowerCase()) || izinTypes[0];
}

export default function IzinPage() {
  const router = useRouter();
  const [history, setHistory] = useState<IzinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      if (token) {
        const res = await authService.getIzin(token);
        setHistory(res.data);
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const disetujui = history.filter(h => Number(h.status) === 1).length;
  const ditolak = history.filter(h => Number(h.status) === 2).length;
  const pending = history.filter(h => !Number(h.status) || Number(h.status) === 0).length;

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Pengajuan Izin</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Kelola pengajuan izin, cuti, dan absensi Anda</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Submit panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Summary stats */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '14px' }}>Ringkasan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Total Pengajuan</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{history.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Disetujui</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>{disetujui}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Pending</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#d97706' }}>{pending}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Ditolak</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>{ditolak}</span>
              </div>
            </div>
          </div>

          {/* Submission type buttons */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Buat Pengajuan</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {izinTypes.map(item => (
                <button
                  key={item.type}
                  onClick={() => { setSelectedType(item.type); setIsModalOpen(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: item.bg,
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.label}</span>
                  <IconPlus size={14} color={item.color} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — History table */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Riwayat Pengajuan</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Urut terbaru</span>
          </div>

          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
              <IconLoader2 size={28} className="animate-spin" color="#1565c0" />
              <p style={{ fontSize: '14px' }}>Memuat data...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', color: '#94a3b8' }}>
              <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlertCircle size={32} color="#cbd5e1" />
              </div>
              <p style={{ fontSize: '14px' }}>Belum ada data pengajuan izin.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Jenis', 'Tanggal Pengajuan', 'Periode', 'Keterangan', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const status = getStatusMeta(item.status);
                  const meta = getIzinMeta(item.tipe);
                  const durasi = Math.ceil((new Date(item.sampai).getTime() - new Date(item.dari).getTime()) / (1000 * 3600 * 24)) + 1;
                  return (
                    <tr
                      key={item.id}
                      style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                            {meta.icon}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{meta.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(item.dari).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {item.dari !== item.sampai && ` – ${new Date(item.sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                        {durasi > 1 && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#94a3b8' }}>({durasi}h)</span>}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.keterangan || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: status.text, background: status.bg, padding: '4px 10px', borderRadius: '6px' }}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <IzinSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={selectedType || ''}
        onSuccess={fetchHistory}
      />
    </div>
  );
}
