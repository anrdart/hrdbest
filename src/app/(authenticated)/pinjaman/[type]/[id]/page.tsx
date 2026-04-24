'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService, PinjamanDetailResponse } from '@/services/auth.service';
import {
  IconArrowLeft,
  IconCalendar,
  IconReceipt2,
  IconCircleCheck,
  IconTrendingUp,
  IconCreditCard,
  IconCash,
  IconHistory,
  IconLoader2,
} from '@tabler/icons-react';
import Swal from 'sweetalert2';

const fmtRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function PinjamanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const id = params.id as string;

  const [data, setData] = useState<PinjamanDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = authService.getToken();
        if (!token) { router.push('/'); return; }
        const res = await authService.getPinjamanDetail(token, type, id);
        if (res.success) setData(res);
        else throw new Error();
      } catch {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengambil rincian pinjaman.' }).then(() => router.back());
      } finally {
        setIsLoading(false);
      }
    })();
  }, [type, id, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', flexDirection: 'column', gap: '12px' }}>
        <IconLoader2 size={32} color="#1565c0" className="animate-spin" />
        <p style={{ fontSize: '14px', color: '#64748b' }}>Memuat rincian pinjaman...</p>
      </div>
    );
  }

  if (!data) return null;

  const { loan, history } = data;
  const totalPinjaman = Number(loan.jumlah_pinjaman || (loan as any).jumlah || 0);
  const totalBayar = history.reduce((s, h) => s + Number(h.jumlah), 0);
  const sisa = totalPinjaman - totalBayar;
  const payPercent = totalPinjaman > 0 ? Math.min((totalBayar / totalPinjaman) * 100, 100) : 0;

  const tipeIcon = type === 'KASBON'
    ? { icon: <IconCash size={26} />, bg: '#fefce8', color: '#ca8a04' }
    : { icon: <IconCreditCard size={26} />, bg: '#eff6ff', color: '#1565c0' };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => router.back()}
          style={{ width: '36px', height: '36px', background: '#f1f5f9', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <IconArrowLeft size={18} color="#475569" />
        </button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>Detail {type}</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{id}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Loan summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Main stats */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: tipeIcon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tipeIcon.color }}>
                {tipeIcon.icon}
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Sisa Pinjaman</p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: sisa <= 0 ? '#22c55e' : '#0f172a' }}>
                  {sisa <= 0 ? 'LUNAS' : fmtRp(sisa)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Progres Pembayaran</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#1565c0' }}>{payPercent.toFixed(1)}%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${payPercent}%`, height: '100%', background: 'linear-gradient(90deg, #1565c0, #3b82f6)', borderRadius: '4px', transition: 'width 1s' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconReceipt2 size={12} /> Total Pinjaman
                </p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{fmtRp(totalPinjaman)}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IconTrendingUp size={12} /> Terbayar
                </p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>{fmtRp(totalBayar)}</p>
              </div>
            </div>
          </div>

          {/* Loan info */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '12px' }}>Info Pinjaman</p>
            {[
              { label: 'Tipe', value: type },
              { label: 'No. Pinjaman', value: id },
              { label: 'Angsuran/Bulan', value: loan.angsuran > 0 ? fmtRp(loan.angsuran) : '—' },
              { label: 'Jumlah Angsuran', value: loan.jumlah_angsuran > 0 ? `${loan.jumlah_angsuran}x` : '—' },
              { label: 'Status', value: sisa <= 0 ? 'LUNAS' : 'AKTIF' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{row.label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Transaction history */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconHistory size={18} color="#64748b" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Riwayat Transaksi</h2>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>{history.length} transaksi</span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <IconHistory size={36} stroke={1.5} color="#cbd5e1" />
              <p style={{ fontSize: '14px' }}>Belum ada riwayat transaksi</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['No. Bukti', 'Tanggal', 'Keterangan', 'Jumlah'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr
                    key={h.no_bukti}
                    style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                      {h.no_bukti}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconCalendar size={13} color="#94a3b8" />
                      {h.tanggal}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.keterangan || (h.cicilan_ke ? `Cicilan ke-${h.cicilan_ke}` : 'Pembayaran')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>
                      +{fmtRp(Number(h.jumlah))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <td colSpan={3} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#64748b', textAlign: 'right' }}>
                    Total Terbayar
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '15px', fontWeight: 900, color: '#16a34a' }}>
                    {fmtRp(totalBayar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
