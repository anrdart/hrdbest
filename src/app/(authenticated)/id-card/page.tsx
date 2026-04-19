'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService, Employee } from '@/services/auth.service';
import { IconChevronLeft, IconRefresh, IconUser, IconBuildingCommunity, IconScan, IconIdBadge2, IconDownload } from '@tabler/icons-react';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import Swal from 'sweetalert2';

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

    if (!token) {
      router.push('/');
      return;
    }

    // Set initial data from local storage if available
    if (userData) {
      setUser(userData);
      // If we already have the full data (nama_jabatan exists), we can stop loading
      if (userData.nama_jabatan) {
        setIsLoading(false);
      }
    }

    // Always fetch latest data from server to get full details (jabatan, dept, etc)
    authService.getProfile(token)
      .then(res => {
        if (res.success) {
          setUser(res.data);
          authService.setUserData(res.data);
        }
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleDownload = async () => {
    if (!printableRef.current) return;
    
    try {
      setIsDownloading(true);
      
      // Wait a bit to ensure all elements are rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await htmlToImage.toPng(printableRef.current, {
        quality: 1,
        pixelRatio: 3, // High definition
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `ID-CARD-${user?.nik}-${user?.nama_karyawan?.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'ID Card berhasil diunduh.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal mengunduh ID Card. Pastikan koneksi internet stabil.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1565c0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const photoUrl = user?.foto 
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/karyawan/${user.foto}` 
    : null;

  // REUSABLE CARD COMPONENTS FOR PRINTING
  const CardFront = ({ isFixed = false }) => (
    <div style={{
      width: isFixed ? '320px' : '100%',
      height: isFixed ? '508px' : '100%',
      borderRadius: '24px',
      overflow: 'hidden',
      background: 'linear-gradient(145deg, #1565c0, #0d47a1)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxShadow: isFixed ? 'none' : '0 20px 40px rgba(13, 71, 161, 0.25)',
    }}>
      {/* Design Elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '30%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '40%', height: '20%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
      
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconIdBadge2 size={18} color="#1565c0" />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>CV. MAKMUR PERMATA</span>
        </div>
        <div style={{ opacity: 0.6 }}>
          <IconScan size={20} color="#ffffff" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '12px', zIndex: 1 }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          border: '4px solid rgba(255,255,255,0.3)', 
          padding: '4px',
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {photoUrl && !imgError ? (
              <img 
                src={photoUrl} 
                alt="Photo" 
                crossOrigin="anonymous"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={() => setImgError(true)}
              />
            ) : (
              <IconUser size={60} color="#cbd5e1" />
            )}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '0 20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{user?.nama_karyawan}</h2>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block' }}>
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

  const CardBack = ({ isFixed = false }) => (
    <div style={{
      width: isFixed ? '320px' : '100%',
      height: isFixed ? '508px' : '100%',
      borderRadius: '24px',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px',
      border: '1px solid #e2e8f0',
      position: 'relative',
      boxShadow: isFixed ? 'none' : '0 20px 40px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <IconIdBadge2 size={24} color="#1565c0" />
           <span style={{ fontSize: '14px', fontWeight: 900, color: '#1565c0', letterSpacing: '0.5px' }}>CV. MAKMUR PERMATA</span>
         </div>
         <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Jln. Perintis Kemerdekaan No. 160</span>
      </div>

      <div style={{ 
        background: '#f8fafc', 
        padding: '24px', 
        borderRadius: '20px', 
        border: '1px dashed #cbd5e1',
        marginBottom: '24px'
      }}>
        <QRCodeSVG 
          value={user?.nik || 'CV-MAKMUR-PERMATA'} 
          size={160}
          level="H"
          includeMargin={false}
        />
      </div>

      <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', lineHeight: '1.6', margin: '0 0 32px 0' }}>
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

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%', paddingBottom: '100px' }}>
      {/* Header Navigation */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <IconChevronLeft size={24} color="#1e293b" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Digital ID Card</h1>
      </div>

      {/* Card Container with Flip Animation */}
      <div 
        style={{ 
          perspective: '1000px', 
          width: '100%', 
          maxWidth: '320px', 
          aspectRatio: '0.63', // ID-1 standard aspect ratio (~1.58) reversed for vertical
          marginBottom: '32px'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer'
        }}>
          {/* FRONT SIDE */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' }}>
            <CardFront />
          </div>
          {/* BACK SIDE */}
          <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <CardBack />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px' }}>
        {/* Flip Instruction */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ textAlign: 'center', background: '#ffffff', padding: '12px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <IconRefresh size={18} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Ketuk kartu untuk putar</span>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: isDownloading ? '#94a3b8' : '#1565c0',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(21, 101, 192, 0.25)',
            transition: 'all 0.2s'
          }}
        >
          {isDownloading ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <IconDownload size={20} />
          )}
          {isDownloading ? 'MEMPROSES...' : 'DOWNLOAD ID CARD'}
        </button>
      </div>

      {/* HIDDEN PRINTABLE VERSION FOR CAPTURE */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div 
          ref={printableRef}
          style={{ 
            display: 'flex', 
            gap: '20px', 
            padding: '40px', 
            background: '#f1f5f9',
            borderRadius: '10px' // Just for clean edges in capture
          }}
        >
          <CardFront isFixed={true} />
          <CardBack isFixed={true} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

