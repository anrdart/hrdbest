'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, Pinjaman, PinjamanResponse } from '@/services/auth.service';
import { 
  IconArrowLeft, 
  IconWallet, 
  IconChevronRight, 
  IconSearch,
  IconReceipt2,
  IconCreditCard,
  IconCash,
  IconCalculator
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';
import PjpSimulatorModal from '@/components/shared/PjpSimulatorModal';


export default function PinjamanPage() {
  const router = useRouter();
  const [data, setData] = useState<PinjamanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PINJAMAN' | 'KASBON'>('PINJAMAN');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          router.push('/');
          return;
        }

        const response = await authService.getPinjaman(token);
        if (response.success) {
          setData(response);
        } else {
          throw new Error('Gagal mengambil data');
        }
      } catch (error) {
        console.error('Error fetching loans:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Gagal mengambil data pinjaman.',
          confirmButtonColor: '#1565c0',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [router]);

  const filteredLoans = data?.data.filter(loan => {
    const matchesSearch = loan.no_pinjaman.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          loan.tipe_pinjaman.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'PINJAMAN') {
      return matchesSearch && (loan.tipe_pinjaman === 'PJP' || loan.tipe_pinjaman === 'PIUTANG');
    } else {
      return matchesSearch && loan.tipe_pinjaman === 'KASBON';
    }
  }) || [];

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%' }}></div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>Memuat Data Pinjaman...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      {/* Header Fixed */}
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
          onClick={() => router.back()}
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
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Data Pinjaman</h1>
      </div>

      <div style={{ padding: '24px 16px' }}>
        {/* Summary Card (Credit Card / ATM Style) */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0d47a1 0%, #1a237e 100%)',
          borderRadius: '24px',
          padding: '24px',
          color: 'white',
          boxShadow: '0 20px 40px rgba(13, 71, 161, 0.25)',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1.586 / 1', // Credit card ratio
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Chip & Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ 
              width: '45px', 
              height: '35px', 
              background: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)', 
              borderRadius: '8px',
              position: 'relative',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ position: 'absolute', top: '10px', left: '0', right: '0', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
              <div style={{ position: 'absolute', top: '20px', left: '0', right: '0', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
              <div style={{ position: 'absolute', top: '0', left: '15px', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
              <div style={{ position: 'absolute', top: '0', left: '30px', bottom: '0', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ textAlign: 'right', opacity: 0.8 }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '2px' }}>PACIFIC PORTAL</p>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: 500, letterSpacing: '1px' }}>FINANCIAL SERVICE</p>
            </div>
          </div>

          {/* Balance */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Sisa Pinjaman Aktif
            </p>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {formatCurrency(data?.summary.total_sisa || 0)}
            </h2>
          </div>

          {/* Footer Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Account Holder</p>
                <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, letterSpacing: '1px' }}>{authService.getUserData()?.nama_karyawan}</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '4px', opacity: 0.9 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginLeft: '-10px' }} />
                </div>
             </div>
          </div>

          {/* Decorative Wave Watermark */}
          <div style={{ 
            position: 'absolute', 
            right: '-30px', 
            bottom: '-20px', 
            opacity: 0.05,
            width: '200px',
            height: '200px',
            background: 'white',
            borderRadius: '50%',
          }} />
        </div>

        {/* Tab Switcher */}
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '16px', 
          marginBottom: '24px' 
        }}>
          <button 
            onClick={() => setActiveTab('PINJAMAN')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px', 
              border: 'none',
              background: activeTab === 'PINJAMAN' ? 'white' : 'transparent',
              color: activeTab === 'PINJAMAN' ? '#1565c0' : '#64748b',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'PINJAMAN' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Pinjaman
          </button>
          <button 
            onClick={() => setActiveTab('KASBON')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              borderRadius: '12px', 
              border: 'none',
              background: activeTab === 'KASBON' ? 'white' : 'transparent',
              color: activeTab === 'KASBON' ? '#1565c0' : '#64748b',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === 'KASBON' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Kasbon
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <IconSearch size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={`Cari di ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '16px',
              border: 'none',
              background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              color: '#1e293b'
            }}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredLoans.map((loan) => (
            <div
              key={loan.no_pinjaman}
              onClick={() => router.push(`/pinjaman/${loan.tipe_pinjaman}/${loan.no_pinjaman}`)}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '14px', 
                background: loan.tipe_pinjaman === 'PJP' ? '#eff6ff' : (loan.tipe_pinjaman === 'KASBON' ? '#fefce8' : '#f0fdf4'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: loan.tipe_pinjaman === 'PJP' ? '#2563eb' : (loan.tipe_pinjaman === 'KASBON' ? '#ca8a04' : '#16a34a')
              }}>
                {loan.tipe_pinjaman === 'PJP' ? <IconReceipt2 size={24} /> : (loan.tipe_pinjaman === 'KASBON' ? <IconCash size={24} /> : <IconCreditCard size={24} />)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{loan.tipe_pinjaman}</h3>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '4px 10px', 
                    borderRadius: '8px',
                    background: loan.sisa_pinjaman === 0 ? '#f0fdf4' : '#fff7ed',
                    color: loan.sisa_pinjaman === 0 ? '#16a34a' : '#ea580c'
                  }}>
                    {loan.sisa_pinjaman === 0 ? 'LUNAS' : 'AKTIF'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', fontFamily: 'monospace' }}>{loan.no_pinjaman}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px 0' }}>Sisa Pinjaman</p>
                    <p style={{ fontSize: '15px', fontWeight: 900, color: '#1565c0', margin: 0 }}>
                      {formatCurrency(loan.sisa_pinjaman)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px 0' }}>Total</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', margin: 0 }}>
                      {formatCurrency(loan.jumlah_pinjaman)}
                    </p>
                  </div>
                </div>
              </div>
              <IconChevronRight size={20} color="#cbd5e1" />
            </div>
          ))}

          {filteredLoans.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <IconWallet size={48} stroke={1.5} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Belum ada data pinjaman</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsSimulatorOpen(true)}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '100px', // Above bottom navigation if any
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1565c0 0%, #1e3a8a 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 32px rgba(21, 101, 192, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <IconCalculator size={30} stroke={2} />
      </button>

      {/* Simulator Modal */}
      <PjpSimulatorModal 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
      />
    </div>
  );
}
