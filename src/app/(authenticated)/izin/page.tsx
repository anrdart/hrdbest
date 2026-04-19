'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, IzinRecord } from '@/services/auth.service';
import { 
  IconChevronLeft, 
  IconPlus, 
  IconStethoscope, 
  IconMoodEmpty, 
  IconBeach, 
  IconBriefcase, 
  IconLogout, 
  IconWalk,
  IconCalendarEvent,
  IconClock,
  IconDotsVertical,
  IconAlertCircle
} from '@tabler/icons-react';
import IzinSubmissionModal from '@/components/shared/IzinSubmissionModal';

export default function IzinPage() {
  const router = useRouter();
  const [history, setHistory] = useState<IzinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFabOpen, setIsFabOpen] = useState(false);
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
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusColor = (status: any) => {
    switch (Number(status)) {
      case 1: return { bg: '#dcfce7', text: '#16a34a', label: 'Disetujui' };
      case 2: return { bg: '#fee2e2', text: '#ef4444', label: 'Ditolak' };
      default: return { bg: '#fef3c7', text: '#d97706', label: 'Pending' };
    }
  };

  const getIzinIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sakit': return <IconStethoscope size={20} color="#ef4444" />;
      case 'absen': return <IconMoodEmpty size={20} color="#f59e0b" />;
      case 'cuti': return <IconBeach size={20} color="#3b82f6" />;
      case 'dinas': return <IconBriefcase size={20} color="#10b981" />;
      case 'pulang': return <IconLogout size={20} color="#8b5cf6" />;
      case 'keluar': return <IconWalk size={20} color="#6366f1" />;
      default: return <IconCalendarEvent size={20} color="#1565c0" />;
    }
  };

  const handleOpenModal = (type: string) => {
    setSelectedType(type);
    setIsModalOpen(true);
    setIsFabOpen(false);
  };

  const fabItems = [
    { type: 'sakit', label: 'Sakit', icon: <IconStethoscope size={20} />, color: '#ef4444' },
    { type: 'absen', label: 'Absen', icon: <IconMoodEmpty size={20} />, color: '#f59e0b' },
    { type: 'cuti', label: 'Cuti', icon: <IconBeach size={20} />, color: '#3b82f6' },
    { type: 'dinas', label: 'Dinas', icon: <IconBriefcase size={20} />, color: '#10b981' },
    { type: 'pulang', label: 'Pulang', icon: <IconLogout size={20} />, color: '#8b5cf6' },
    { type: 'keluar', label: 'Keluar', icon: <IconWalk size={20} />, color: '#6366f1' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        padding: '24px 20px 20px', 
        borderBottomLeftRadius: '24px', 
        borderBottomRightRadius: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <button 
            onClick={() => router.back()}
            style={{ border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconChevronLeft size={24} color="#1e293b" />
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Daftar Izin</h2>
          <div style={{ width: '40px' }} />
        </div>
      </div>

      {/* Stats Card */}
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)', 
          borderRadius: '24px', 
          padding: '20px',
          color: 'white',
          boxShadow: '0 8px 20px rgba(30,41,59,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>Total Pengajuan</p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{history.length} <span style={{ fontSize: '14px', fontWeight: 400 }}>Kali</span></h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCalendarEvent size={24} />
          </div>
        </div>
      </div>

      {/* History List */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Riwayat Pengajuan</h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Urut terbaru</span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#1e293b', borderRadius: '50%', margin: '0 auto' }}></div>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
            <IconAlertCircle size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Belum ada data pengajuan izin.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item) => {
              const status = getStatusColor(item.status);
              return (
                <div key={item.id} style={{ 
                  background: 'white', 
                  borderRadius: '20px', 
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '14px', 
                    background: '#f8fafc', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {getIzinIcon(item.tipe)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>Izin {item.tipe}</span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        background: status.bg, 
                        color: status.text,
                        textTransform: 'uppercase'
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0', lineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.keterangan}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconCalendarEvent size={12} color="#94a3b8" />
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {item.dari !== item.sampai && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconClock size={12} color="#94a3b8" />
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{Math.ceil((new Date(item.sampai).getTime() - new Date(item.dari).getTime()) / (1000 * 3600 * 24)) + 1} Hari</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {isFabOpen && (
        <div 
          onClick={() => setIsFabOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100 }} 
        />
      )}

      <div style={{ position: 'fixed', bottom: '100px', right: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', zIndex: 101 }}>
        {isFabOpen && fabItems.map((item, index) => (
          <div 
            key={item.type} 
            onClick={() => handleOpenModal(item.type)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              animation: `fabIn 0.3s ease forwards ${index * 0.05}s`,
              opacity: 0,
              transform: 'translateY(20px)',
              cursor: 'pointer'
            }}
          >
            <div style={{ background: 'white', padding: '6px 12px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
              {item.label}
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {item.icon}
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            background: '#1e293b', 
            color: 'white', 
            border: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(30,41,59,0.3)',
            transform: isFabOpen ? 'rotate(45deg)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <IconPlus size={32} stroke={2.5} />
        </button>
      </div>

      <IzinSubmissionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={selectedType || ''}
        onSuccess={fetchHistory}
      />

      <style jsx>{`
        @keyframes fabIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
