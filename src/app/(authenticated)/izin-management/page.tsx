'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconFileCheck,
  IconCheck,
  IconX,
  IconLoader2,
  IconFilter,
  IconClock,
  IconUser,
} from '@tabler/icons-react';
import { authService } from '@/services/auth.service';
import Swal from 'sweetalert2';

interface IzinRequest {
  id: number;
  user_id: number;
  nik: string;
  nama_karyawan: string;
  role: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type: string;
  status: string;
  attachment_url: string | null;
  created_at: string;
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusStyle(status: string): { color: string; bg: string } {
  switch (status) {
    case 'approved':
      return { color: '#22c55e', bg: '#f0fdf4' };
    case 'rejected':
      return { color: '#ef4444', bg: '#fef2f2' };
    default:
      return { color: '#f59e0b', bg: '#fffbeb' };
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Disetujui';
    case 'rejected':
      return 'Ditolak';
    default:
      return 'Menunggu';
  }
}

export default function IzinManagementPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<IzinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchRequests = async (filter: string) => {
    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/izin/all${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          authService.clearToken();
          router.push('/');
          return;
        }
        throw new Error(`Gagal memuat data (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
        setError(data.message || 'Gagal memuat data pengajuan.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchRequests(statusFilter);
  }, [statusFilter, router]);

  const handleApprove = async (id: number) => {
    const result = await Swal.fire({
      title: 'Setujui Pengajuan',
      text: 'Apakah Anda yakin ingin menyetujui pengajuan ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const res = await fetch(`/api/izin/${id}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Gagal menyetujui pengajuan.');

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Pengajuan berhasil disetujui.',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchRequests(statusFilter);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyetujui pengajuan. Silakan coba lagi.',
      });
    }
  };

  const handleReject = async (id: number) => {
    const result = await Swal.fire({
      title: 'Tolak Pengajuan',
      input: 'textarea',
      inputLabel: 'Alasan penolakan',
      inputPlaceholder: 'Masukkan alasan penolakan...',
      inputAttributes: { 'aria-label': 'Alasan penolakan' },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal',
      preConfirm: (note) => {
        if (!note.trim()) {
          Swal.showValidationMessage('Alasan penolakan wajib diisi.');
        }
        return note;
      },
    });

    if (!result.isConfirmed) return;

    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const res = await fetch(`/api/izin/${id}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: result.value }),
      });

      if (!res.ok) throw new Error('Gagal menolak pengajuan.');

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Pengajuan berhasil ditolak.',
        timer: 2000,
        showConfirmButton: false,
      });

      fetchRequests(statusFilter);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menolak pengajuan. Silakan coba lagi.',
      });
    }
  };

  /* ───── computed stats ───── */
  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  const stats = [
    { label: 'Total Pengajuan', value: totalRequests, color: '#1565c0', bg: '#eff6ff', icon: <IconFileCheck size={20} color="#1565c0" /> },
    { label: 'Menunggu Persetujuan', value: pendingCount, color: '#f59e0b', bg: '#fffbeb', icon: <IconClock size={20} color="#f59e0b" /> },
    { label: 'Disetujui', value: approvedCount, color: '#22c55e', bg: '#f0fdf4', icon: <IconCheck size={20} color="#22c55e" /> },
  ];

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Kelola Izin &amp; Cuti
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Kelola semua pengajuan izin dan cuti karyawan
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <IconFilter size={18} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Status</span>
        </div>
        {FILTER_OPTIONS.map((opt) => {
          const active = statusFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: active ? '#1565c0' : '#f1f5f9',
                color: active ? '#ffffff' : '#475569',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '3px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Requests table ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Daftar Pengajuan Izin &amp; Cuti
          </h2>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconLoader2 size={28} color="#1565c0" className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat data pengajuan...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconX size={28} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '8px' }}>{error}</p>
            <button
              onClick={() => fetchRequests(statusFilter)}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1565c0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <IconFileCheck size={28} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Tidak ada data pengajuan.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['No', 'NIK', 'Nama', 'Tipe', 'Dari', 'Sampai', 'Alasan', 'Status', 'Aksi'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, idx) => {
                  const sStyle = getStatusStyle(req.status);
                  return (
                    <tr key={req.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontFamily: 'monospace' }}>
                        {req.nik}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IconUser size={14} color="#94a3b8" />
                          {req.nama_karyawan}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#3b82f6',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {req.leave_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {formatDate(req.start_date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {formatDate(req.end_date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.reason || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: sStyle.color,
                            background: sStyle.bg,
                            padding: '3px 8px',
                            borderRadius: '6px',
                          }}
                        >
                          {getStatusLabel(req.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleApprove(req.id)}
                              title="Setujui"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: '#f0fdf4',
                                color: '#22c55e',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <IconCheck size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              title="Tolak"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: '#fef2f2',
                                color: '#ef4444',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <IconX size={16} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
