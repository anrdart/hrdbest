'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconFingerprint,
  IconCalendarEvent,
  IconFileText,
  IconFileCheck,
  IconCash,
  IconWallet,
  IconId,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';
import { authService, Employee } from '@/services/auth.service';
import Swal from 'sweetalert2';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navByRole: Record<string, NavItem[]> = {
  super_admin: [
    { label: 'Dashboard', icon: <IconLayoutDashboard size={20} stroke={2} />, href: '/dashboard' },
    { label: 'Manajemen Karyawan', icon: <IconUsers size={20} stroke={2} />, href: '/karyawan' },
    { label: 'Kelola Izin', icon: <IconFileCheck size={20} stroke={2} />, href: '/izin-management' },
    { label: 'Laporan Absensi', icon: <IconChartBar size={20} stroke={2} />, href: '/laporan' },
    { label: 'Pengaturan', icon: <IconSettings size={20} stroke={2} />, href: '/pengaturan' },
  ],
  hrd: [
    { label: 'Dashboard', icon: <IconLayoutDashboard size={20} stroke={2} />, href: '/dashboard' },
    { label: 'Presensi', icon: <IconFingerprint size={20} stroke={2} />, href: '/attendance' },
    { label: 'Riwayat Presensi', icon: <IconCalendarEvent size={20} stroke={2} />, href: '/history' },
    { label: 'Pengajuan Izin', icon: <IconFileText size={20} stroke={2} />, href: '/izin' },
    { label: 'Kelola Izin', icon: <IconFileCheck size={20} stroke={2} />, href: '/izin-management' },
    { label: 'Slip Gaji', icon: <IconCash size={20} stroke={2} />, href: '/slip-gaji' },
    { label: 'Pinjaman', icon: <IconWallet size={20} stroke={2} />, href: '/pinjaman' },
    { label: 'ID Card', icon: <IconId size={20} stroke={2} />, href: '/id-card' },
    { label: 'Laporan Absensi', icon: <IconChartBar size={20} stroke={2} />, href: '/laporan' },
  ],
  manager: [
    { label: 'Dashboard', icon: <IconLayoutDashboard size={20} stroke={2} />, href: '/dashboard' },
    { label: 'Presensi', icon: <IconFingerprint size={20} stroke={2} />, href: '/attendance' },
    { label: 'Riwayat Presensi', icon: <IconCalendarEvent size={20} stroke={2} />, href: '/history' },
    { label: 'Pengajuan Izin', icon: <IconFileText size={20} stroke={2} />, href: '/izin' },
    { label: 'Slip Gaji', icon: <IconCash size={20} stroke={2} />, href: '/slip-gaji' },
    { label: 'Pinjaman', icon: <IconWallet size={20} stroke={2} />, href: '/pinjaman' },
    { label: 'ID Card', icon: <IconId size={20} stroke={2} />, href: '/id-card' },
    { label: 'Laporan Absensi', icon: <IconChartBar size={20} stroke={2} />, href: '/laporan' },
  ],
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Employee | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [role, setRole] = useState<string>('');
  const [navItems, setNavItems] = useState<NavItem[]>(navByRole.hrd);

  useEffect(() => {
    setMounted(true);
    const userData = authService.getUserData();
    setUser(userData);
    const r = authService.getRole();
    setRole(r);
    setNavItems(navByRole[r] || navByRole.hrd);
  }, []);

  if (!mounted) {
    return (
      <aside style={{ width: '240px', minHeight: '100dvh', background: '#ffffff', borderRight: '1px solid #e2e8f0', flexShrink: 0 }} />
    );
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar Aplikasi?',
      text: 'Anda perlu login kembali untuk mengakses portal.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1565c0',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      setIsLoggingOut(true);
      const token = authService.getToken();
      try {
        if (token) await authService.logout(token);
      } catch {}
      authService.clearToken();
      router.replace('/');
      setIsLoggingOut(false);
    }
  };

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    hrd: 'HRD / Admin',
    manager: 'Manager',
  };

  const roleBadgeColor: Record<string, string> = {
    super_admin: '#7c3aed',
    hrd: '#1565c0',
    manager: '#0891b2',
  };

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '240px',
        minHeight: '100dvh',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '72px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconBuildingSkyscraper size={20} color="#ffffff" stroke={2} />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>PT PCA</p>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>Portal Karyawan</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: '10px',
                background: active ? '#eff6ff' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.15s ease',
                color: active ? '#1565c0' : '#475569',
              }}
            >
              <span style={{ color: active ? '#1565c0' : '#64748b', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#1565c0' : '#475569',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
              )}
              {!collapsed && active && (
                <div
                  style={{
                    marginLeft: 'auto',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#1565c0',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          margin: '0 8px 8px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: 'pointer',
          color: '#64748b',
        }}
        title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
      >
        {collapsed ? <IconChevronRight size={16} stroke={2.5} /> : <IconChevronLeft size={16} stroke={2.5} />}
      </button>

      {/* User profile */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 800,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {user?.nama_karyawan?.[0] || 'U'}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nama_karyawan || 'User'}
            </p>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#ffffff',
                background: roleBadgeColor[role] || '#1565c0',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              {roleLabel[role] || role}
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Keluar"
            style={{
              background: 'none',
              border: 'none',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              color: '#94a3b8',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isLoggingOut ? <IconLoader2 size={16} className="animate-spin" /> : <IconLogout size={16} stroke={2} />}
          </button>
        )}
      </div>
    </aside>
  );
}
