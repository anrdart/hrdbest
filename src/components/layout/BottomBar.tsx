'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { IconHome, IconFingerprint, IconLayoutGrid } from '@tabler/icons-react';

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname === '/dashboard';
  const isHistory = pathname === '/history';
  const isAttendance = pathname === '/attendance';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 12px',
        background: '#ffffff',
        borderTop: '1px solid #f3f4f6',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Beranda */}
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 12px',
          flex: 1,
        }}
      >
        <IconHome size={22} color={isHome ? '#1565c0' : '#9ca3af'} stroke={2.5} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: isHome ? '#1565c0' : '#9ca3af' }}>Beranda</span>
      </button>

      {/* Absensi (center button) */}
      <button
        onClick={() => router.push('/attendance')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          marginTop: '-28px',
          flex: 1,
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(21,101,192,0.35)',
            border: '4px solid #ffffff',
          }}
        >
          <IconFingerprint size={26} color="#ffffff" stroke={2.5} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, color: isAttendance ? '#1565c0' : '#4b5563' }}>Absensi</span>
      </button>

      {/* Data Absensi */}
      <button
        onClick={() => router.push('/history')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 12px',
          flex: 1,
        }}
      >
        <IconLayoutGrid size={22} color={isHistory ? '#1565c0' : '#9ca3af'} stroke={2.5} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: isHistory ? '#1565c0' : '#9ca3af' }}>Data Absensi</span>
      </button>
    </div>
  );
}
