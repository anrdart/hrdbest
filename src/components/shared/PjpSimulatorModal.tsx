'use client';

import { useState, useEffect } from 'react';
import { PjpSimulationRules, authService } from '@/services/auth.service';
import { IconX, IconCalculator, IconAlertCircle, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface PjpSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatNumber = (val: string) => {
  if (!val) return '';
  const num = val.replace(/[^0-9]/g, '');
  return new Intl.NumberFormat('id-ID').format(parseInt(num || '0'));
};

const parseNumber = (val: string) => {
  return parseInt(val.replace(/[^0-9]/g, '') || '0');
};

export default function PjpSimulatorModal({ isOpen, onClose }: PjpSimulatorModalProps) {
  const [rules, setRules] = useState<PjpSimulationRules | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchRules = async () => {
        setIsLoading(true);
        try {
          const token = authService.getToken();
          if (token) {
            const res = await authService.getPjpSimulationRules(token);
            setRules(res);
          }
        } catch (error) {
          console.error('Failed to fetch simulation rules:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRules();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAmount = parseNumber(amount);
  const currentTenor = parseInt(tenor || '0');
  const installment = currentTenor > 0 ? Math.ceil(currentAmount / currentTenor) : 0;

  const isAmountOver = rules ? currentAmount > rules.data.plafon_max : false;
  const isTenorOver = rules ? currentTenor > rules.data.tenor_max : false;
  const isInstallmentOver = rules ? installment > rules.data.angsuran_max : false;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        style={{
          width: '100%',
          background: 'white',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565c0' }}>
              <IconCalculator size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Simulator PJP</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Hitung estimasi cicilan Anda</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={20} color="#64748b" />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Mengambil aturan terbaru...</p>
          </div>
        ) : (
          <div>
            {!rules?.data.is_eligible && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', color: '#ef4444', marginBottom: '8px' }}>
                  <IconAlertCircle size={20} />
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Belum Memenuhi Syarat</p>
                </div>
                {rules?.data.messages.map((m, i) => (
                  <p key={i} style={{ fontSize: '13px', color: '#7f1d1d', margin: '4px 0 0 28px' }}>• {m}</p>
                ))}
              </div>
            )}

            {/* Employee Constraints Info */}
            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>Maks. Plafon</p>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{formatCurrency(rules?.data.plafon_max || 0)}</p>
               </div>
               <div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0' }}>Tenor Max</p>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{rules?.data.tenor_max} Bulan</p>
               </div>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Jumlah Pinjaman</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#94a3b8', fontSize: '14px' }}>Rp</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatNumber(e.target.value))}
                    placeholder="Contoh: 5.000.000"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 45px',
                      borderRadius: '14px',
                      border: isAmountOver ? '2px solid #ef4444' : '2px solid #e2e8f0',
                      fontSize: '16px',
                      fontWeight: 800,
                      outline: 'none',
                      color: '#1e293b'
                    }}
                  />
                </div>
                {isAmountOver && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>Melebihi batas plafon maksimal</p>}
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Tenor (Bulan)</label>
                <input
                  type="number"
                  value={tenor}
                  onChange={(e) => setTenor(e.target.value)}
                  placeholder={`Maks. ${rules?.data.tenor_max} bulan`}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: isTenorOver ? '2px solid #ef4444' : '2px solid #e2e8f0',
                    fontSize: '16px',
                    fontWeight: 800,
                    outline: 'none',
                    color: '#1e293b'
                  }}
                />
                {isTenorOver && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>Melebihi batas tenor maksimal</p>}
              </div>

              {/* Result Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, #1565c0 0%, #1e3a8a 100%)', 
                borderRadius: '24px', 
                padding: '24px', 
                color: 'white',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8, margin: 0 }}>Estimasi Angsuran</p>
                  <p style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '100px', margin: 0 }}>Per Bulan</p>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0 0 0' }}>{formatCurrency(installment)}</h2>
                
                {isInstallmentOver && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '16px', background: 'rgba(239, 68, 68, 0.2)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <IconAlertCircle size={16} />
                    <p style={{ fontSize: '11px', fontWeight: 600, margin: 0 }}>Cicilan melebihi 40% Gaji + Tunjangan ({formatCurrency(rules?.data.angsuran_max || 0)})</p>
                  </div>
                )}
                
                {!isAmountOver && !isTenorOver && !isInstallmentOver && currentAmount > 0 && currentTenor > 0 && (
                   <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '16px', background: 'rgba(34, 197, 94, 0.2)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <IconCheck size={16} />
                    <p style={{ fontSize: '11px', fontWeight: 600, margin: 0 }}>Simulasi ini memenuhi kriteria plafon</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', background: '#fff9eb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                <IconInfoCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#92400e', margin: 0 }}>
                  Hasil simulasi ini hanya bersifat estimasi berdasarkan kebijakan PJP yang berlaku. Keputusan akhir tetap berada pada Departemen HRD.
                </p>
              </div>

              <button 
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '15px',
                  fontWeight: 700,
                  marginTop: '12px',
                  cursor: 'pointer'
                }}
              >
                Tutup Simulator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
