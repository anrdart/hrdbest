'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService, SlipDetailResponse } from '@/services/auth.service';
import { 
  IconArrowLeft, 
  IconDownload, 
  IconTrendingUp, 
  IconTrendingDown, 
  IconShieldCheck,
  IconBuildingCommunity,
  IconCalendarEvent,
  IconGift
} from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { toPng } from 'html-to-image';

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(number);
};

const formatDecimal = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

export default function SlipGajiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const month = Number(params.month);
  const year = Number(params.year);
  
  const [data, setData] = useState<SlipDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const slipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = authService.getToken();
        const userData = authService.getUserData();
        
        if (!token || !userData) {
          router.push('/');
          return;
        }

        const response = await authService.getSlipDetail(token, month, year, userData.nik);
        if (response.success) {
          setData(response);
        } else {
          throw new Error('Gagal mengambil data');
        }
      } catch (error) {
        console.error('Error fetching slip detail:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Gagal mengambil rincian slip gaji.',
          confirmButtonColor: '#1565c0',
        }).then(() => router.back());
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [month, year, router]);

  const handleDownload = async () => {
    if (!slipRef.current) return;

    try {
      Swal.fire({
        title: 'Menyiapkan Unduhan...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const dataUrl = await toPng(slipRef.current, {
        cacheBust: true,
        backgroundColor: '#f8fafc',
        quality: 1,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `Slip_Gaji_${month}_${year}.png`;
      link.href = dataUrl;
      link.click();

      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Slip gaji berhasil diunduh.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire('Error', 'Gagal mengunduh slip gaji', 'error');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%' }}></div>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>Menghitung Gaji Anda...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, employee, start_date, end_date } = data;

  // Custom component for detailed rows
  const DetailRow = ({ label, center = '', right, isTotal = false, isSubData = false }: { label: string, center?: string, right: string | React.ReactNode, isTotal?: boolean, isSubData?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: isTotal ? '0' : '0 0 12px 0' }}>
      <span style={{ color: isTotal ? '#1e293b' : '#64748b', fontWeight: isTotal ? 800 : 600, flex: 2, fontSize: isSubData ? '12px' : '13px' }}>
        {label}
      </span>
      {center && (
        <span style={{ color: '#94a3b8', fontWeight: 600, flex: 1, textAlign: 'center', fontSize: '12px' }}>
          {center}
        </span>
      )}
      <span style={{ color: isTotal ? '#1565c0' : '#1e293b', fontWeight: isTotal ? 800 : 700, flex: 1, textAlign: 'right' }}>
        {right}
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      {/* Header Fixed */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 100%)',
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.5px' }}>Detail Slip Gaji</h1>
        </div>
        <button
          onClick={handleDownload}
          style={{
            background: 'white',
            border: 'none',
            borderRadius: '12px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1565c0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <IconDownload size={20} stroke={2.5} />
        </button>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div 
          ref={slipRef}
          style={{ 
            background: 'white', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Top Banner inside Card */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '10px', opacity: 0.1 }}>
              <IconBuildingCommunity size={120} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '1px' }}>SLIP GAJI DIGITAL</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#bfdbfe', fontWeight: 500 }}>
              <IconCalendarEvent size={16} />
              <span>Periode: {start_date} - {end_date}</span>
            </div>

            {/* Employee Info Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '16px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#1e3a8a' }}>
                  {employee.nama_karyawan ? employee.nama_karyawan[0] : 'E'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>{employee.nama_karyawan}</h3>
                  <p style={{ fontSize: '12px', margin: 0, color: '#bfdbfe', fontFamily: 'monospace' }}>{employee.nik}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#bfdbfe', margin: '0 0 4px 0' }}>Kantor / Dept.</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{employee.kode_cabang} / {employee.kode_dept}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#bfdbfe', margin: '0 0 4px 0' }}>Jabatan</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{employee.nama_jabatan || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* THP Highlight */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>
                Total Bersih (THP)
              </p>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {formatRupiah(summary.netto)}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Pendapatan Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #2563eb', paddingBottom: '8px' }}>
                  <IconTrendingUp size={20} color="#2563eb" stroke={2.5} />
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Rincian PENDAPATAN & LEMBUR</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <DetailRow label="Gaji Pokok" right={formatRupiah(summary.gaji_pokok || 0)} />
                  <DetailRow label="Tunj. Jabatan" right={formatRupiah(summary.tunjangan.jabatan || 0)} />
                  <DetailRow label="Tunj. Masa Kerja" right={formatRupiah(summary.tunjangan.masa_kerja || 0)} />
                  <DetailRow label="Tunj. Tanggung Jawab" right={formatRupiah(summary.tunjangan.tanggung_jawab || 0)} />
                  <DetailRow label="Tunj. Makan" right={formatRupiah(summary.tunjangan.makan || 0)} />
                  {employee.kategori_jabatan === 'MJ' && (
                    <DetailRow label="Tunj. Istri" right={formatRupiah(summary.tunjangan.istri || 0)} />
                  )}
                  <DetailRow label="Tunj. Skill" right={formatRupiah(summary.tunjangan.skill || 0)} />

                  <div style={{ padding: '12px 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', margin: '8px 0 20px 0' }}>
                    <DetailRow label="∑ JAM KERJA BULAN INI" right={`${formatDecimal(summary.total_jam_kerja)} JAM`} isTotal />
                    <div style={{ marginTop: '8px' }}>
                      <DetailRow label="UPAH / JAM" right={formatDecimal(summary.upah_perjam)} isTotal />
                    </div>
                  </div>

                  <DetailRow label="UPAH BULAN INI" right={formatRupiah(summary.upah_perjam * summary.total_jam_kerja)} />
                  <DetailRow label="Overtime 1" center={`${formatDecimal(summary.overtime.jam_1)} JAM`} right={formatRupiah(summary.overtime.upah_1)} isSubData />
                  <DetailRow label="Overtime 2" center={`${formatDecimal(summary.overtime.jam_2)} JAM`} right={formatRupiah(summary.overtime.upah_2)} isSubData />
                  <DetailRow label="Lembur Hari Libur" center={`${formatDecimal(summary.overtime.jam_libur)} JAM`} right={formatRupiah(summary.overtime.upah_libur)} isSubData />
                  <DetailRow label="Premi Shift 2" center={`${summary.premi_shift.shift_2_hari} HARI`} right={formatRupiah(summary.premi_shift.shift_2_upah)} isSubData />
                  <DetailRow label="Premi Shift 3" center={`${summary.premi_shift.shift_3_hari} HARI`} right={formatRupiah(summary.premi_shift.shift_3_upah)} isSubData />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#166534', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <span>TOTAL PENERIMAAN</span>
                    <span>{formatRupiah(summary.bruto)}</span>
                  </div>
                </div>
              </div>

              {/* Potongan Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #ef4444', paddingBottom: '8px' }}>
                  <IconTrendingDown size={20} color="#ef4444" stroke={2.5} />
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Rincian POTONGAN</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <DetailRow label="Absensi" center={`${formatDecimal(summary.potongan.jam_absensi)} JAM`} right={""} />
                  <DetailRow label="Denda Keterlambatan" right={formatRupiah(summary.potongan.denda || 0)} />
                  <DetailRow label="Softloan" right={formatRupiah(summary.potongan.pjp || 0)} />
                  <DetailRow label="Pinjaman Perusahaan" right={formatRupiah(summary.potongan.piutang || 0)} />
                  <DetailRow label="Kasbon" right={formatRupiah(summary.potongan.kasbon || 0)} />
                  <DetailRow label="BPJS KES" right={formatRupiah(summary.potongan.bpjs_kesehatan || 0)} />
                  <DetailRow label="BPJS TENAGA KERJA" right={formatRupiah(summary.potongan.bpjs_tk || 0)} />
                  <DetailRow label="SPIP" right={formatRupiah(summary.potongan.spip || 0)} />
                  <DetailRow label="Pengurang" right={formatRupiah(summary.potongan.pengurang || 0)} />
                  <DetailRow label="Penambah" right={formatRupiah(summary.penambah || 0)} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#991b1b', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <span>TOTAL POTONGAN</span>
                    <span>{formatRupiah(summary.potongan.total)}</span>
                  </div>
                </div>
              </div>

              {/* Insentif Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #8b5cf6', paddingBottom: '8px' }}>
                  <IconGift size={20} color="#8b5cf6" stroke={2.5} />
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>INSENTIF</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {employee.kategori_jabatan === 'MJ' ? (
                    <>
                      <DetailRow label="RUANG LINGKUP" right={formatRupiah(employee.im_ruanglingkup || 0)} />
                      <DetailRow label="PENEMPATAN" right={formatRupiah(employee.im_penempatan || 0)} />
                      <DetailRow label="KINERJA" right={formatRupiah(employee.im_kinerja || 0)} />
                      <DetailRow label="KENDARAAN" right={formatRupiah(employee.im_kendaraan || 0)} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="MASA KERJA" right={formatRupiah(employee.iu_masakerja || 0)} />
                      <DetailRow label="LEMBUR" right={formatRupiah(employee.iu_lembur || 0)} />
                      <DetailRow label="PENEMPATAN" right={formatRupiah(employee.iu_penempatan || 0)} />
                      <DetailRow label="KPI" right={formatRupiah(employee.iu_kpi || 0)} />
                    </>
                  )}
                </div>
              </div>

            </div>

            <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', marginBottom: '24px' }}>
                <IconShieldCheck size={18} />
                <span style={{ fontSize: '11px', textAlign: 'center' }}>Dokumen ini diterbitkan sah secara elektronik.</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  REF: SLIP-{year}{month}-{employee.nik.replace(/\./g, '')}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '20px', fontStyle: 'italic' }}>Dicetak secara digital</p>
                  <p style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', margin: 0 }}>CV. MAKMUR PERMATA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
