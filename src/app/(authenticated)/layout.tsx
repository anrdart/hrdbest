import React from 'react';
import BottomBar from '@/components/layout/BottomBar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="layout-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="mobile-container" style={{ width: '100%', maxWidth: 'none', paddingBottom: '80px', background: '#f8fafc' }}>
        <main style={{ flex: 1, width: '100%' }}>
          {children}
        </main>
        <BottomBar />
      </div>
    </div>
  );
}
