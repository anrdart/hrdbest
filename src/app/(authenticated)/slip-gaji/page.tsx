'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, SlipMonth } from '@/services/auth.service';
import { IconArrowLeft, IconCalendarEvent, IconChevronRight, IconFileText } from '@tabler/icons-react';
import Swal from 'sweetalert2';

export default function SlipGajiPage() {
  const router = useRouter();
  const [months, setMonths] = useState<SlipMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          router.push('/');
          return;
        }
        const response = await authService.getSlipMonths(token);
        if (response.success) {
          setMonths(response.data);
        }
      } catch (error) {
        console.error('Error fetching slip months:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Gagal mengambil data bulan slip gaji.',
          confirmButtonColor: '#1565c0',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonths();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '80px', display: 'flex', flexDirection: 'column' }}>
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
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Daftar Slip Gaji</h1>
      </div>

      <div style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px' }}>
          Slip gaji Anda selama 12 bulan terakhir
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Memuat daftar bulan...</p>
          </div>
        ) : months.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {months.map((item) => (
              <div
                key={`${item.month}-${item.year}`}
                onClick={() => router.push(`/slip-gaji/${item.month}/${item.year}`)}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#e0e7ff', 
                    color: '#4f46e5',
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid #c7d2fe'
                  }}>
                    <IconCalendarEvent size={24} stroke={1.5} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      {item.month_name} {item.year}
                    </h3>
                  </div>
                </div>
                <div style={{ 
                  background: '#f8fafc', 
                  borderRadius: '10px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <IconChevronRight size={20} stroke={2} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconFileText size={40} color="#cbd5e1" stroke={1.5} />
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tidak Ada Data</p>
              <p style={{ fontSize: '13px' }}>Belum ada data slip gaji tersedia.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
