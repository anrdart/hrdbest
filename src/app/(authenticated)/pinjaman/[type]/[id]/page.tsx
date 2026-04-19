'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService, PinjamanDetailResponse } from '@/services/auth.service';
import { 
  IconArrowLeft, 
  IconCalendar, 
  IconReceipt2,
  IconClockHour4,
  IconCircleCheck,
  IconTrendingUp,
  IconCreditCard,
  IconCash,
  IconHistory
} from '@tabler/icons-react';
import Swal from 'sweetalert2';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(number);
};

export default function PinjamanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const id = params.id as string;
  
  const [data, setData] = useState<PinjamanDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          router.push('/');
          return;
        }

        const response = await authService.getPinjamanDetail(token, type, id);
        if (response.success) {
          setData(response);
        } else {
          throw new Error('Gagal mengambil data');
        }
      } catch (error) {
        console.error('Error fetching loan detail:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Gagal mengambil rincian pinjaman.',
        }).then(() => router.back());
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [type, id, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%' }}></div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>Memuat Riwayat...</p>
      </div>
    );
  }

  if (!data) return null;

  const { loan, history } = data;
  const totalPinjaman = Number(loan.jumlah_pinjaman || (loan as any).jumlah);
  const totalBayar = history.reduce((sum, h) => sum + Number(h.jumlah), 0);
  const sisa = totalPinjaman - totalBayar;
  const payPercent = totalPinjaman > 0 ? (totalBayar / totalPinjaman) * 100 : 0;

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
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Detail {type}</h1>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>{id}</p>
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        {/* Main Stats Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '28px', 
          padding: '24px', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)', 
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Sisa Pinjaman</p>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', margin: 0 }}>{formatRupiah(sisa)}</h2>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565c0' }}>
              {type === 'KASBON' ? <IconCash size={30} /> : <IconCreditCard size={30} />}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Progres Pembayaran</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#1565c0' }}>{payPercent.toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${payPercent}%`, height: '100%', background: 'linear-gradient(90deg, #1565c0, #3b82f6)', borderRadius: '4px', transition: 'width 1s ease-out' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconReceipt2 size={13} /> Total Pinjaman
              </p>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{formatRupiah(totalPinjaman)}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconTrendingUp size={13} /> Terbayar
              </p>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a', margin: 0 }}>{formatRupiah(totalBayar)}</p>
            </div>
          </div>
        </div>

        {/* Timeline Version for History */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <IconHistory size={18} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Riwayat Transaksi</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
          {/* Vertical Line for Timeline */}
          {history.length > 0 && (
             <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: '#f1f5f9', zIndex: 0 }} />
          )}

          {history.length > 0 ? (
            history.map((h, i) => (
              <div 
                key={h.no_bukti} 
                style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  padding: '16px 0', 
                  position: 'relative', 
                  zIndex: 1 
                }}
              >
                {/* Dot */}
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '16px', 
                  background: 'white', 
                  border: '4px solid #f1f5f9',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#16a34a',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                }}>
                  <IconCircleCheck size={24} />
                </div>

                <div style={{ flex: 1, background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Pembayaran Cicilan</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>{h.no_bukti}</p>
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 900, color: '#166534', margin: 0 }}>+{formatRupiah(Number(h.jumlah))}</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    <IconCalendar size={12} color="#94a3b8" />
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{h.tanggal}</span>
                  </div>

                  {h.keterangan && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        &quot;{h.keterangan}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '48px 24px', textAlign: 'center', color: '#94a3b8', border: '1px solid #f1f5f9' }}>
               <IconHistory size={48} stroke={1.2} style={{ marginBottom: '16px', opacity: 0.3 }} />
               <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }}>Belum ada transaksi</p>
               <p style={{ fontSize: '12px', margin: 0 }}>Semua pembayaran Anda akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
