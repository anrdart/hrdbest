'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService, Employee } from '@/services/auth.service';
import { IconRefresh, IconUser, IconBuildingCommunity, IconScan, IconIdBadge2, IconDownload, IconLoader2 } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import Swal from 'sweetalert2';

const CardFront = ({ user, imgError, setImgError, isFixed = false }: { user: Employee | null; imgError: boolean; setImgError: (v: boolean) => void; isFixed?: boolean }) => (
  <div style={{
    width: isFixed ? '320px' : '100%', height: isFixed ? '508px' : '100%',
    borderRadius: '24px', overflow: 'hidden',
    background: 'linear-gradient(145deg, #1565c0, #0d47a1)',
    display: 'flex', flexDirection: 'column', position: 'relative',
    boxShadow: isFixed ? 'none' : '0 20px 48px rgba(13,71,161,0.3)'
  }}>
    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '30%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '40%', height: '20%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', background: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconIdBadge2 size={18} color="#1565c0" />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>CV. MAKMUR PERMATA</span>
      </div>
      <IconScan size={20} color="rgba(255,255,255,0.5)" />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', zIndex: 1 }}>
      <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', padding: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {(() => {
            const photoUrl = user?.foto
              ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/karyawan/${user.foto}`
              : null;
            return photoUrl && !imgError ? (
              <img src={photoUrl} alt="Photo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
            ) : (
              <IconUser size={60} color="#cbd5e1" />
            );
          })()}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', padding: '0 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{user?.nama_karyawan}</h2>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '100px', display: 'inline-block' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>{user?.nama_jabatan}</span>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 'auto', padding: '24px', background: 'rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', zIndex: 1 }}>
      <div>
        <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Employee ID</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{user?.nik}</span>
      </div>
      <div>
        <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Branch</span>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{user?.nama_cabang || 'Pusat'}</span>
      </div>
    </div>
  </div>
);

const CardBack = ({ user, isFixed = false }: { user: Employee | null; isFixed?: boolean }) => (
  <div style={{
    width: isFixed ? '320px' : '100%', height: isFixed ? '508px' : '100%',
    borderRadius: '24px', background: '#ffffff',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '32px 24px', border: '1px solid #e2e8f0',
    boxShadow: isFixed ? 'none' : '0 20px 40px rgba(0,0,0,0.1)'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconIdBadge2 size={24} color="#1565c0" />
        <span style={{ fontSize: '14px', fontWeight: 900, color: '#1565c0' }}>CV. MAKMUR PERMATA</span>
      </div>
      <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Jln. Perintis Kemerdekaan No. 160</span>
    </div>
    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
      <QRCodeSVG value={user?.nik || 'CV-MAKMUR-PERMATA'} size={160} level="H" includeMargin={false} />
    </div>
    <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
      Kartu ini adalah kartu identitas resmi karyawan. Jika ditemukan, mohon hubungi HRD Department atau kembalikan ke kantor pusat terdekat.
    </p>
    <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
        <IconBuildingCommunity size={16} />
        <span style={{ fontSize: '11px', fontWeight: 700 }}>{user?.nama_dept || 'Department Name'}</span>
      </div>
      <div style={{ height: '1px', background: '#f1f5f9' }} />
      <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
        Property of CV. MAKMUR PERMATA • {new Date().getFullYear()}
      </div>
    </div>
  </div>
);

export default function IDCardPage() {
  const router = useRouter();
  const printableRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<Employee | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    const userData = authService.getUserData();
    if (!token) { router.push('/'); return; }
    if (userData) { setUser(userData); if (userData.nama_jabatan) setIsLoading(false); }
    authService.getProfile(token)
      .then(res => { if (res.success) { setUser(res.data); authService.setUserData(res.data); } })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleDownload = async () => {
    if (!printableRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(r => setTimeout(r, 500));
      const dataUrl = await htmlToImage.toPng(printableRef.current, { quality: 1, pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `ID-CARD-${user?.nik}-${user?.nama_karyawan?.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'ID Card berhasil diunduh.', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal mengunduh ID Card.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const photoUrl = user?.foto
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/karyawan/${user.foto}`
    : null;

  

  

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh' }}>
        <IconLoader2 size={32} color="#1565c0" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Digital ID Card</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Kartu identitas digital karyawan</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '40px', alignItems: 'start' }}>

        {/* LEFT — Flip card */}
        <div>
          <div
            style={{ perspective: '1000px', width: '100%', aspectRatio: '0.63', marginBottom: '16px', cursor: 'pointer' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div style={{
              position: 'relative', width: '100%', height: '100%',
              transition: 'transform 0.6s', transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' }}>
                <CardFront user={user} imgError={imgError} setImgError={setImgError} />
              </div>
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <CardBack user={user} />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ textAlign: 'center', background: '#ffffff', padding: '10px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <IconRefresh size={15} color="#64748b" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Klik untuk putar kartu</span>
          </div>
        </div>

        {/* RIGHT — Info + Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* User info card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1565c0, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                {user?.nama_karyawan?.[0] || 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{user?.nama_karyawan}</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{user?.nama_jabatan}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Employee ID (NIK)', value: user?.nik },
                { label: 'Departemen', value: user?.nama_dept },
                { label: 'Cabang', value: user?.nama_cabang },
              ].map(row => row.value && (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              width: '100%', padding: '16px',
              borderRadius: '12px',
              background: isDownloading ? '#94a3b8' : '#1565c0',
              color: '#ffffff', border: 'none',
              fontSize: '14px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              boxShadow: isDownloading ? 'none' : '0 4px 16px rgba(21,101,192,0.3)',
              transition: 'all 0.15s',
            }}
          >
            {isDownloading
              ? <><IconLoader2 size={18} className="animate-spin" /> MEMPROSES...</>
              : <><IconDownload size={18} /> DOWNLOAD ID CARD</>}
          </button>

          {/* Note */}
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
            ID Card akan diunduh dalam format PNG resolusi tinggi.<br />
            Cocok untuk dicetak atau disimpan di perangkat Anda.
          </p>
        </div>
      </div>

      {/* Hidden printable for capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printableRef} style={{ display: 'flex', gap: '20px', padding: '40px', background: '#f1f5f9', borderRadius: '10px' }}>
          <CardFront user={user} imgError={imgError} setImgError={setImgError} isFixed={true} />
          <CardBack user={user} isFixed={true} />
        </div>
      </div>
    </div>
  );
}
