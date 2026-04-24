'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconMapPin,
  IconFingerprint,
  IconCheck,
  IconAlertTriangle,
  IconScan,
  IconFaceId,
  IconLogin,
  IconLogout2,
  IconCalendar,
  IconClock,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import { authService, AttendanceTodayData } from '@/services/auth.service';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';
import * as faceapi from 'face-api.js';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(t?: string | null) {
  return t ? t.substring(0, 5) : '--:--';
}

export default function AttendancePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceTodayData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const isWithinRadius = (() => {
    if (!location || !attendanceData?.lok_kantor) return false;
    const [lat, lng] = attendanceData.lok_kantor.lokasi_cabang.split(',').map(Number);
    return getDistanceInMeters(location.lat, location.lng, lat, lng) <= attendanceData.lok_kantor.radius_cabang;
  })();

  const distance = (() => {
    if (!location || !attendanceData?.lok_kantor) return null;
    const [lat, lng] = attendanceData.lok_kantor.lokasi_cabang.split(',').map(Number);
    return Math.round(getDistanceInMeters(location.lat, location.lng, lat, lng));
  })();

  const hasCheckedIn = !!attendanceData?.cek?.jam_in;
  const hasCheckedOut = !!attendanceData?.cek?.jam_out;
  const isHoliday = attendanceData?.status_libur || attendanceData?.status_libur_pengganti || false;
  const isWfh = attendanceData?.status_wfh || false;

  const getButtonState = () => {
    if (isHoliday) return { label: 'HARI LIBUR', disabled: true, color: '#94a3b8', status: 'none' as const };
    if (hasCheckedIn && hasCheckedOut) return { label: 'PRESENSI LENGKAP', disabled: true, color: '#22c55e', status: 'none' as const };
    const faceReady = isModelsLoaded && isFaceDetected;
    const disabled = !isCameraReady || !location || !faceReady || isSubmitting;
    if (hasCheckedIn) return { label: faceReady ? 'ABSEN PULANG' : 'POSISIKAN WAJAH', disabled, color: '#ef4444', status: 'pulang' as const };
    return { label: faceReady ? 'ABSEN MASUK' : 'POSISIKAN WAJAH', disabled, color: '#1565c0', status: 'masuk' as const };
  };
  const btn = getButtonState();

  const captureImage = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const handleAttendance = async () => {
    if (btn.disabled || !location) return;
    const token = authService.getToken();
    if (!token) { router.push('/'); return; }
    const image = captureImage();
    if (!image) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal mengambil foto. Coba lagi.', confirmButtonColor: '#1565c0' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authService.storeAttendance(token, { lokasi: `${location.lat},${location.lng}`, statuspresensi: btn.status as 'masuk' | 'pulang', image });
      if (res.success) {
        await Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.message || 'Presensi tercatat.', confirmButtonColor: '#22c55e', timer: 2500, timerProgressBar: true });
        window.location.reload();
      } else {
        Swal.fire({ icon: res.type === 'radius' ? 'warning' : 'error', title: 'Peringatan', text: res.message, confirmButtonColor: '#f59e0b' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan sistem.', confirmButtonColor: '#ef4444' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    let active = true;

    import('leaflet').then(leaflet => {
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });

    (async () => {
      const token = authService.getToken();
      if (!token) { router.push('/'); return; }
      try {
        const res = await authService.getAttendanceToday(token);
        if (active && res.success) setAttendanceData(res.data);
      } catch { /* silently fail */ } finally {
        if (active) setIsDataLoading(false);
      }
    })();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraReady(true); }
      })
      .catch(() => {/* no camera, handled by isCameraReady=false */});

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { if (active) setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]).then(() => { if (active) setIsModelsLoaded(true); }).catch(() => {});

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    if (!isCameraReady || !isModelsLoaded) return;
    const interval = setInterval(async () => {
      if (videoRef.current?.readyState === 4) {
        try {
          const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions());
          setIsFaceDetected(!!det);
        } catch {}
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isCameraReady, isModelsLoaded]);

  if (!isMounted) return null;

  const jamMasuk = fmt(attendanceData?.jam_kerja?.jam_masuk);
  const jamPulang = fmt(attendanceData?.jam_kerja?.jam_pulang);

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Presensi</h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Lakukan check-in atau check-out untuk mencatat kehadiran Anda</p>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Camera panel */}
        <div style={{ background: '#000000', borderRadius: '20px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }}
          />

          {/* Face scanner overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{
              width: '220px',
              height: '220px',
              border: `2.5px solid ${isFaceDetected ? '#22c55e' : 'rgba(255,255,255,0.4)'}`,
              borderRadius: '36px',
              position: 'relative',
              boxShadow: isFaceDetected ? '0 0 32px rgba(34,197,94,0.4)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {(['tl', 'tr', 'bl', 'br'] as const).map(c => {
                const styles: any = { position: 'absolute', width: '32px', height: '32px', borderRadius: 0 };
                const col = isFaceDetected ? '#22c55e' : '#ffffff';
                if (c === 'tl') { styles.top = -8; styles.left = -8; styles.borderTop = `4px solid ${col}`; styles.borderLeft = `4px solid ${col}`; styles.borderRadius = '4px 0 0 0'; }
                if (c === 'tr') { styles.top = -8; styles.right = -8; styles.borderTop = `4px solid ${col}`; styles.borderRight = `4px solid ${col}`; styles.borderRadius = '0 4px 0 0'; }
                if (c === 'bl') { styles.bottom = -8; styles.left = -8; styles.borderBottom = `4px solid ${col}`; styles.borderLeft = `4px solid ${col}`; styles.borderRadius = '0 0 0 4px'; }
                if (c === 'br') { styles.bottom = -8; styles.right = -8; styles.borderBottom = `4px solid ${col}`; styles.borderRight = `4px solid ${col}`; styles.borderRadius = '0 0 4px 0'; }
                return <div key={c} style={styles} />;
              })}
              {!isFaceDetected && isModelsLoaded && (
                <div style={{ position: 'absolute', left: 10, right: 10, height: '2px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', boxShadow: '0 0 8px #3b82f6', animation: 'scan 2.5s linear infinite', top: '50%' }} />
              )}
            </div>
          </div>

          {/* Status badge top */}
          <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{
              background: isFaceDetected ? 'rgba(34,197,94,0.92)' : 'rgba(30,30,30,0.7)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${isFaceDetected ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
            }}>
              {isFaceDetected
                ? <IconFaceId size={16} color="#ffffff" />
                : <IconScan size={16} color="#94a3b8" />}
              <span style={{ fontSize: '11px', fontWeight: 700, color: isFaceDetected ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isModelsLoaded ? (isFaceDetected ? 'Wajah Terdeteksi' : 'Posisikan Wajah') : 'Memuat Model...'}
              </span>
            </div>
          </div>

          {/* Status top-right */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
            {isWfh && <span style={{ background: 'rgba(37,99,235,0.85)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>WFH</span>}
            {isHoliday && <span style={{ background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>LIBUR</span>}
            {hasCheckedIn && (
              <span style={{ background: 'rgba(34,197,94,0.85)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconCheck size={12} /> {hasCheckedOut ? 'Lengkap' : 'Sudah Masuk'}
              </span>
            )}
          </div>

          {/* Loading overlay */}
          {!isCameraReady && (
            <div style={{ position: 'absolute', inset: 0, background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <IconLoader2 size={32} color="#3b82f6" className="animate-spin" />
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Menyiapkan kamera...</p>
            </div>
          )}

          <style>{`@keyframes scan { 0%{top:10%} 50%{top:90%} 100%{top:10%} }`}</style>
        </div>

        {/* RIGHT — Info & Action panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Today check-in/out status */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconClock size={15} /> Kehadiran Hari Ini
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <IconLogin size={14} color="#16a34a" />
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Masuk</span>
                </div>
                <p style={{ fontSize: '22px', fontWeight: 900, color: attendanceData?.cek?.jam_in ? '#0f172a' : '#94a3b8', letterSpacing: '1px' }}>
                  {fmt(attendanceData?.cek?.jam_in)}
                </p>
              </div>
              <div style={{ background: '#fff5f5', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <IconLogout2 size={14} color="#dc2626" />
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Pulang</span>
                </div>
                <p style={{ fontSize: '22px', fontWeight: 900, color: attendanceData?.cek?.jam_out ? '#0f172a' : '#94a3b8', letterSpacing: '1px' }}>
                  {fmt(attendanceData?.cek?.jam_out)}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule info */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconCalendar size={15} /> Jadwal Kerja
            </p>
            {isDataLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                <IconLoader2 size={16} className="animate-spin" /> Memuat...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Jadwal</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{attendanceData?.jadwal?.nama_jadwal || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Jam Kerja</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1565c0' }}>{jamMasuk} – {jamPulang}</span>
                </div>
              </div>
            )}
          </div>

          {/* Location map */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconMapPin size={15} /> Lokasi Anda
              </p>
              {location && (
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: isWithinRadius ? '#16a34a' : '#dc2626',
                  background: isWithinRadius ? '#f0fdf4' : '#fff5f5',
                  padding: '3px 8px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {isWithinRadius ? <IconCheck size={12} /> : <IconAlertTriangle size={12} />}
                  {isWithinRadius ? 'Dalam Radius' : `Luar Radius (${distance}m)`}
                </span>
              )}
            </div>
            <div style={{ height: '180px', position: 'relative' }}>
              {location ? (
                <MapContainer center={[location.lat, location.lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[location.lat, location.lng]} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '8px', color: '#94a3b8' }}>
                  <IconLoader2 size={20} className="animate-spin" />
                  <span style={{ fontSize: '12px' }}>Mendapatkan lokasi...</span>
                </div>
              )}
            </div>
            {attendanceData?.lok_kantor && (
              <div style={{ padding: '8px 16px 12px', fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>📍 {attendanceData.lok_kantor.nama_cabang}</span>
                <span>Radius: {attendanceData.lok_kantor.radius_cabang}m</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={handleAttendance}
            disabled={btn.disabled}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              background: btn.disabled ? '#e2e8f0' : btn.color,
              color: btn.disabled ? '#94a3b8' : '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              border: 'none',
              cursor: btn.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: btn.disabled ? 'none' : `0 4px 16px ${btn.color}40`,
              transition: 'all 0.15s ease',
              letterSpacing: '0.5px',
            }}
          >
            {isSubmitting
              ? <><IconLoader2 size={18} className="animate-spin" /> MEMPROSES...</>
              : <><IconFingerprint size={18} /> {btn.label}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
