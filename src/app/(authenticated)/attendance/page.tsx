'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronLeft, IconInfoCircle, IconCalendar, IconMapPin, IconFingerprint, IconCheck, IconAlertTriangle, IconScan, IconFaceId } from '@tabler/icons-react';
import { authService, AttendanceTodayData } from '@/services/auth.service';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';
import * as faceapi from 'face-api.js';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AttendancePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [L, setL] = useState<any>(null);

  // API data
  const [attendanceData, setAttendanceData] = useState<AttendanceTodayData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Face Detection states
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);

  // Derived states
  const isWithinRadius = (() => {
    if (!location || !attendanceData?.lok_kantor) return false;
    const [officeLat, officeLng] = attendanceData.lok_kantor.lokasi_cabang.split(',').map(Number);
    const distance = getDistanceInMeters(location.lat, location.lng, officeLat, officeLng);
    return distance <= attendanceData.lok_kantor.radius_cabang;
  })();

  const hasCheckedIn = attendanceData?.cek?.jam_in != null;
  const hasCheckedOut = attendanceData?.cek?.jam_out != null;
  const isHoliday = attendanceData?.status_libur || attendanceData?.status_libur_pengganti || false;
  const isWfh = attendanceData?.status_wfh || false;

  // Determine button state and label
  const getButtonState = () => {
    if (isHoliday) return { label: 'HARI LIBUR', disabled: true, bg: '#94a3b8', status: 'none' };
    if (hasCheckedIn && hasCheckedOut) return { label: 'SUDAH PRESENSI LENGKAP', disabled: true, bg: '#22c55e', status: 'none' };
    
    // Check for face detection
    const isFaceReady = isModelsLoaded && isFaceDetected;
    const isDisabled = !isCameraReady || !location || !isFaceReady || isSubmitting;
    
    if (hasCheckedIn && !hasCheckedOut) return { 
        label: !isFaceDetected && isModelsLoaded ? 'WAJAH TIDAK TERDETEKSI' : 'ABSEN PULANG', 
        disabled: isDisabled, 
        bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
        status: 'pulang' 
    };

    return { 
        label: !isFaceDetected && isModelsLoaded ? 'WAJAH TIDAK TERDETEKSI' : 'ABSEN MASUK', 
        disabled: isDisabled, 
        bg: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)', 
        status: 'masuk' 
    };
  };
  const buttonState = getButtonState();

  // Format time string (e.g. "08:00:00" -> "08:00")
  const formatTime = (time: string | undefined | null) => {
    if (!time) return '--:--';
    return time.substring(0, 5);
  };

  const captureImage = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Draw current frame
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // Flip horizontally because camera is mirrored
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/png');
  };

  const handleAttendance = async () => {
    if (buttonState.disabled || !location || isSubmitting) return;

    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    const image = captureImage();
    if (!image) {
      const msg = 'Gagal mengambil foto. Silakan coba lagi.';
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: msg,
        confirmButtonColor: '#1e88e5'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.storeAttendance(token, {
        lokasi: `${location.lat},${location.lng}`,
        statuspresensi: buttonState.status as 'masuk' | 'pulang',
        image: image
      });

      if (response.success) {
        const msg = response.message || 'Terimakasih, Selamat Bekerja';
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: msg,
          confirmButtonColor: '#22c55e',
          timer: 3000,
          timerProgressBar: true
        });
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const isRadiusError = response.type === 'radius' || response.message.toLowerCase().includes('radius');
        Swal.fire({
          icon: isRadiusError ? 'warning' : 'error',
          title: 'Peringatan',
          text: response.message,
          confirmButtonColor: isRadiusError ? '#f59e0b' : '#ef4444'
        });
      }
    } catch (err: any) {
      const msg = 'Terjadi kesalahan sistem. Silakan coba lagi nanti.';
      console.error('Attendance submit error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    
    // Load Leaflet on client side
    import('leaflet').then(leaflet => {
      setL(leaflet.default);
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });

    let isMounted = true;

    // Fetch attendance data
    const fetchAttendanceData = async () => {
      const token = authService.getToken();
      if (!token) {
        router.push('/');
        return;
      }
      try {
        const response = await authService.getAttendanceToday(token);
        if (isMounted && response.success) {
          setAttendanceData(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching attendance data:', err);
        if (isMounted) setError('Gagal memuat data presensi.');
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Camera error:', err);
          setError('Gagal mengakses kamera.');
        }
      }
    };

    const getGeolocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          (err) => {
            if (isMounted) setError('Gagal mendapatkan lokasi.');
          },
          { enableHighAccuracy: true }
        );
      }
    };

    // Load Face-API models
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        if (isMounted) setIsModelsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
      }
    };

    const startFaceDetection = () => {
        if (detectionInterval) clearInterval(detectionInterval);
        
        const interval = setInterval(async () => {
            if (videoRef.current && isCameraReady && isModelsLoaded) {
                try {
                    const detections = await faceapi.detectSingleFace(
                        videoRef.current, 
                        new faceapi.TinyFaceDetectorOptions()
                    );
                    if (isMounted) setIsFaceDetected(!!detections);
                } catch (e) {
                    console.error('Detection error:', e);
                }
            }
        }, 1000); // Check every 1 second for performance
        
        setDetectionInterval(interval);
    };

    fetchAttendanceData();
    startCamera();
    getGeolocation();
    loadModels();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (detectionInterval) clearInterval(detectionInterval);
    };
  }, [router]); // Removed dependencies to prevent re-running

  useEffect(() => {
    if (isCameraReady && isModelsLoaded && isMounted) {
      const interval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          try {
            const detections = await faceapi.detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            );
            setIsFaceDetected(!!detections);
          } catch (e) {
            console.error('Detection error:', e);
          }
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isCameraReady, isModelsLoaded, isMounted]);

  // Shift/schedule name from API
  const shiftName = attendanceData?.jam_kerja?.nama_jam_kerja || 'Memuat...';
  const namaJadwal = attendanceData?.jadwal?.nama_jadwal || '';
  const jamMasuk = formatTime(attendanceData?.jam_kerja?.jam_masuk);
  const jamPulang = formatTime(attendanceData?.jam_kerja?.jam_pulang);

  if (!isMounted) return null;

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: 'calc(100dvh - 80px)', 
      display: 'flex',
      flexDirection: 'column',
      background: '#000000', 
      overflow: 'hidden' 
    }}>
        {/* Full-screen Camera Preview Container */}
        <div style={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                objectPosition: 'center',
                transform: 'scaleX(-1)',
                filter: isFaceDetected ? 'none' : 'grayscale(30%)'
              }}
            />
        </div>

        {/* Face Detection Scanner Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '180px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{ 
            width: '240px', 
            height: '240px', 
            border: `2px solid ${isFaceDetected ? '#22c55e' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '40px',
            position: 'relative',
            boxShadow: isFaceDetected ? '0 0 30px rgba(34,197,94,0.3)' : 'none',
            transition: 'all 0.3s ease'
          }}>
             {/* Corner brackets */}
             <div style={{ position: 'absolute', top: -10, left: -10, width: '40px', height: '40px', borderTop: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderLeft: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRadius: '4px 0 0 0' }} />
             <div style={{ position: 'absolute', top: -10, right: -10, width: '40px', height: '40px', borderTop: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRight: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRadius: '0 4px 0 0' }} />
             <div style={{ position: 'absolute', bottom: -10, left: -10, width: '40px', height: '40px', borderBottom: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderLeft: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRadius: '0 0 0 4px' }} />
             <div style={{ position: 'absolute', bottom: -10, right: -10, width: '40px', height: '40px', borderBottom: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRight: `4px solid ${isFaceDetected ? '#22c55e' : '#ffffff'}`, borderRadius: '0 0 4px 0' }} />
             
             {/* Scanning Line */}
             {!isFaceDetected && isModelsLoaded && (
               <div style={{
                 position: 'absolute',
                 left: '10px',
                 right: '10px',
                 height: '2px',
                 background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                 boxShadow: '0 0 10px #3b82f6',
                 animation: 'scan-line 3s linear infinite',
                 top: '50%'
               }} />
             )}
          </div>

          <style>{`
            @keyframes scan-line {
              0% { top: 10%; }
              50% { top: 90%; }
              100% { top: 10%; }
            }
          `}</style>
        </div>

        {/* Top Controls Overlay */}
        <div style={{ position: 'absolute', top: '24px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <button onClick={() => router.back()} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <IconChevronLeft size={24} color="#ffffff" />
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Status badges */}
            {isWfh && (
              <div style={{ background: 'rgba(34,197,94,0.8)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                WFH
              </div>
            )}
            {isHoliday && (
              <div style={{ background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                LIBUR
              </div>
            )}
            <button style={{ border: 'none', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconInfoCircle size={22} color="#ffffff" />
            </button>
          </div>
        </div>

        {/* Face Detection Status Badge */}
        <div style={{ position: 'absolute', top: hasCheckedIn ? '140px' : '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 11 }}>
            <div style={{
                background: isFaceDetected ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
                backdropFilter: 'blur(10px)',
                padding: '6px 14px',
                borderRadius: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap'
            }}>
                {isFaceDetected ? <IconFaceId size={18} color="#ffffff" /> : <IconScan size={18} color="#ffffff" />}
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {isModelsLoaded ? (isFaceDetected ? 'Wajah Terdeteksi' : 'Posisikan Wajah Anda') : 'Memuat Sensor...'}
                </span>
            </div>
        </div>

        {/* Check-in status overlay */}
        {hasCheckedIn && (
          <div style={{ position: 'absolute', top: '80px', left: '16px', right: '16px', zIndex: 10 }}>
            <div style={{
              background: 'rgba(34,197,94,0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <IconCheck size={20} color="#ffffff" stroke={2.5} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                  {hasCheckedOut ? 'Presensi Lengkap' : 'Sudah Masuk'}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                  Masuk: {attendanceData?.cek?.jam_in ? new Date(attendanceData.cek.jam_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  {hasCheckedOut && attendanceData?.cek?.jam_out && (
                    <> · Pulang: {new Date(attendanceData.cek.jam_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM PANEL */}
        <div style={{ position: 'relative', zIndex: 20, marginTop: '-25px' }}>
          {/* Dark Section (Shift / Stats) */}
          <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', padding: '12px 16px', borderRadius: '24px 24px 0 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'block' }}>{isDataLoading ? '...' : namaJadwal || shiftName}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jadwal Shift</span>
            </div>
            <div style={{ width: '1px', height: '20px', background: '#334155' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', display: 'block' }}>{isDataLoading ? '...' : `${jamMasuk} - ${jamPulang}`}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jam Kerja</span>
            </div>
          </div>

          {/* White Section (Map & Action) */}
          <div style={{ background: '#ffffff', padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Location status + Map */}
            <div style={{ background: '#f8fafc', borderRadius: '20px', overflow: 'hidden', height: '90px', position: 'relative', border: '1px solid #e2e8f0' }}>
              {location ? (
                <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[location.lat, location.lng]} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                  <IconMapPin size={24} style={{ marginBottom: '8px' }} />
                  <span>Obtaining location...</span>
                </div>
              )}
              {/* Coordinate + radius status overlay */}
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
                <div style={{ background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>
                  {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Detecting...'}
                </div>
                {location && attendanceData && (
                  <div style={{
                    background: isWithinRadius ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {isWithinRadius ? <IconCheck size={12} /> : <IconAlertTriangle size={12} />}
                    {isWithinRadius ? 'Dalam Radius' : 'Luar Radius'}
                  </div>
                )}
              </div>
            </div>

            {/* Office info */}
            {attendanceData?.lok_kantor && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  📍 {attendanceData.lok_kantor.nama_cabang}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                  Rad: {attendanceData.lok_kantor.radius_cabang}m
                </span>
              </div>
            )}

            {/* Attendance Button */}
            <button
              onClick={handleAttendance}
              disabled={buttonState.disabled}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: buttonState.disabled ? '#cbd5e1' : buttonState.bg,
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 800,
                border: 'none',
                boxShadow: buttonState.disabled ? 'none' : '0 8px 24px rgba(21, 101, 192, 0.25)',
                cursor: buttonState.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: (buttonState.disabled || isSubmitting) ? 0.7 : 1,
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSubmitting ? (
                   <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  buttonState.status === 'none' ? <IconCheck size={20} color="#ffffff" stroke={2.5} /> : <IconFingerprint size={20} color="#ffffff" stroke={2.5} />
                )}
              </div>
              {isSubmitting ? 'MEMPROSES...' : buttonState.label}
            </button>
          </div>
        </div>

        {/* Status Indicator (Loading overlay) */}
        {!isCameraReady && (
          <div style={{ position: 'absolute', inset: 0, background: '#000000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Menyiapkan Kamera...</p>
          </div>
        )}
    </div>
  );
}
