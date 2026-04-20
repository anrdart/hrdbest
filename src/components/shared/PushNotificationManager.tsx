'use client';

import { useState, useEffect } from 'react';
import { pushService } from '@/services/push.service';
import { authService } from '@/services/auth.service';
import { IconBellRinging, IconX, IconBellPlus, IconLoader2 } from '@tabler/icons-react';
import Swal from 'sweetalert2';

export default function PushNotificationManager() {
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const checkStatus = async () => {
      if (!('Notification' in window)) {
        setPermission('unsupported');
        return;
      }

      const currentPermission = await pushService.checkPermission();
      console.log("DEBUG: Push Permission Status:", currentPermission);
      setPermission(currentPermission);
      
      if (currentPermission === 'default') {
        const subscription = await pushService.getSubscription();
        if (!subscription) {
          setShowBanner(true);
        }
      }
    };

    checkStatus();
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const token = authService.getToken();

    if (!token) {
      setIsSubscribing(false);
      Swal.fire({
        title: 'Sesi Berakhir',
        text: 'Silakan login kembali untuk mengaktifkan notifikasi.',
        icon: 'warning'
      });
      return;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== 'granted') {
        throw new Error('Izin notifikasi tidak diberikan');
      }

      const response = await pushService.subscribeUser(token);
      
      if (response.success) {
        setPermission('granted');
        setShowBanner(false);
        Swal.fire({
          title: 'Notifikasi Aktif',
          text: 'Anda akan menerima pemberitahuan langsung di perangkat ini.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-2xl',
          }
        });
      } else {
        throw new Error(response.message || 'Gagal menyimpan ke server');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Swal.fire({
        title: 'Gagal Mengaktifkan',
        text: error.message,
        icon: 'error',
        customClass: {
          popup: 'rounded-2xl',
        }
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (permission === 'unsupported' || permission === 'granted' || permission === 'denied' || !showBanner) {
    return null;
  }

  return (
    <div 
      style={{ 
        position: 'fixed',
        bottom: '85px',
        left: '16px',
        right: '16px',
        zIndex: 150,
        animation: 'slideUp 0.5s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div 
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '20px',
          padding: '16px',
          position: 'relative',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'rgba(56, 189, 248, 0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconBellRinging size={22} color="#38bdf8" stroke={2} />
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              Aktifkan Notifikasi
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
              Dapatkan info gaji dan pengajuan izin langsung di HP Anda.
            </p>
          </div>

          <button 
            onClick={() => setShowBanner(false)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <IconX size={18} />
          </button>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={isSubscribing}
          style={{
            background: '#38bdf8',
            color: '#0f172a',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: isSubscribing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            position: 'relative',
            zIndex: 1
          }}
        >
          {isSubscribing ? (
            <>
              <IconLoader2 size={18} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <IconBellPlus size={18} stroke={2.5} />
              <span>Aktifkan Sekarang</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
