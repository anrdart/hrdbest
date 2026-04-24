'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, Pinjaman, PinjamanResponse } from '@/services/auth.service';
import { IconWallet, IconChevronRight, IconSearch, IconReceipt2, IconCreditCard, IconCash, IconCalculator, IconLoader2 } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import PjpSimulatorModal from '@/components/shared/PjpSimulatorModal';

export default function PinjamanPage() {
  const router = useRouter();
  const [data, setData] = useState<PinjamanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PINJAMAN' | 'KASBON'>('PINJAMAN');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = authService.getToken();
        if (!token) { router.push('/'); return; }
        const res = await authService.getPinjaman(token);
        if (res.success) setData(res);
      } catch {}
      finally { setIsLoading(false); }
    })();
  }, [router]);

  const filtered = data?.data.filter(loan => {
    const q = searchTerm.toLowerCase();
    const matchSearch = loan.no_pinjaman.toLowerCase().includes(q) || loan.tipe_pinjaman.toLowerCase().includes(q);
    return matchSearch && (activeTab === 'PINJAMAN' ? ['PJP', 'PIUTANG'].includes(loan.tipe_pinjaman) : loan.tipe_pinjaman === 'KASBON');
  }) || [];

  const tipeIcon = (tipe: string) => {
    if (tipe === 'PJP') return { icon: <IconReceipt2 size={20} />, bg: '#eff6ff', color: '#2563eb' };
    if (tipe === 'KASBON') return { icon: <IconCash size={20} />, bg: '#fefce8', color: '#ca8a04' };
    return { icon: <IconCreditCard size={20} />, bg: '#f0fdf4', color: '#16a34a' };
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Data Pinjaman</h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Kelola dan pantau pinjaman aktif Anda</p>
        </div>
        <button
          onClick={() => setIsSimulatorOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', background: '#1565c0', color: '#ffffff',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 700,
          }}
        >
          <IconCalculator size={16} /> Simulasi Pinjaman
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px', color: '#94a3b8' }}>
          <IconLoader2 size={28} className="animate-spin" color="#1565c0" />
          <p style={{ fontSize: '14px' }}>Memuat data pinjaman...</p>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div style={{
            background: 'linear-gradient(135deg, #0d47a1 0%, #1a237e 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
            color: '#ffffff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(13,71,161,0.25)',
          }}>
            <div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Sisa Pinjaman Aktif</p>
              <p style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '1px' }}>{formatCurrency(data?.summary.total_sisa || 0)}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{authService.getUserData()?.nama_karyawan}</p>
            </div>
            <div style={{ opacity: 0.2 }}>
              <IconWallet size={64} stroke={1.5} />
            </div>
          </div>

          {/* Tab + Search row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
              {(['PINJAMAN', 'KASBON'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab ? '#ffffff' : 'transparent',
                    color: activeTab === tab ? '#1565c0' : '#64748b',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'PINJAMAN' ? 'Pinjaman' : 'Kasbon'}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <IconSearch size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari nomor pinjaman..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 30px',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  fontSize: '13px', color: '#0f172a', background: '#ffffff',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <IconWallet size={40} stroke={1.5} color="#cbd5e1" />
                <p style={{ fontSize: '14px' }}>Belum ada data {activeTab.toLowerCase()}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['No. Pinjaman', 'Tipe', 'Tanggal', 'Jumlah', 'Angsuran/Bulan', 'Sisa', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((loan, idx) => {
                    const meta = tipeIcon(loan.tipe_pinjaman);
                    const isLunas = loan.sisa_pinjaman === 0;
                    return (
                      <tr
                        key={loan.no_pinjaman}
                        style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}
                        onClick={() => router.push(`/pinjaman/${loan.tipe_pinjaman}/${loan.no_pinjaman}`)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                          {loan.no_pinjaman}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                              {meta.icon}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{loan.tipe_pinjaman}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(loan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
                          {formatCurrency(loan.jumlah_pinjaman)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                          {loan.angsuran > 0 ? formatCurrency(loan.angsuran) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 800, color: isLunas ? '#22c55e' : '#1565c0' }}>
                          {isLunas ? '—' : formatCurrency(loan.sisa_pinjaman)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                            background: isLunas ? '#f0fdf4' : '#fff7ed',
                            color: isLunas ? '#16a34a' : '#ea580c',
                          }}>
                            {isLunas ? 'LUNAS' : 'AKTIF'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <IconChevronRight size={16} color="#cbd5e1" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      <PjpSimulatorModal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
    </div>
  );
}
