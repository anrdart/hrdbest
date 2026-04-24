'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconInfoCircle,
  IconUsers,
  IconClock,
  IconTrash,
  IconLoader2,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { authService } from '@/services/auth.service';

/* ───── types ───── */
interface KaryawanRow {
  nik: string;
  nama_karyawan: string;
  role: string;
  nama_jabatan: string;
  nama_dept: string;
  nama_cabang: string;
}

interface KaryawanResponse {
  success: boolean;
  data: KaryawanRow[];
}

interface SettingsData {
  jam_masuk: string;
  jam_pulang: string;
  hari_libur: string;
}

/* ───── role helpers ───── */
const roleBadgeColor: Record<string, string> = {
  super_admin: '#7c3aed',
  hrd: '#1565c0',
  manager: '#0891b2',
  employee: '#475569',
};

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  hrd: 'HRD',
  manager: 'Manager',
  employee: 'Karyawan',
};

/* ───── page ───── */
export default function PengaturanPage() {
  const router = useRouter();
  const [karyawanList, setKaryawanList] = useState<KaryawanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* settings state */
  const [settings, setSettings] = useState<SettingsData>({
    jam_masuk: '08:00',
    jam_pulang: '17:00',
    hari_libur: 'Sabtu,Minggu',
  });
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ───── fetch helpers ───── */
  const fetchKaryawan = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/karyawan', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Gagal memuat data karyawan (${res.status})`);
      }

      const json: KaryawanResponse = await res.json();
      if (json.success) {
        setKaryawanList(json.data);
      } else {
        setError('Respons API tidak berhasil.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) return;

      const json = (await res.json()) as { success: boolean; data: Record<string, string> };
      if (json.success && json.data) {
        setSettings({
          jam_masuk: json.data.jam_masuk || '08:00',
          jam_pulang: json.data.jam_pulang || '17:00',
          hari_libur: json.data.hari_libur || 'Sabtu,Minggu',
        });
      }
    } catch {
      /* silent — defaults are fine */
    } finally {
      setIsSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchKaryawan(token);
    fetchSettings(token);
  }, [router, fetchKaryawan, fetchSettings]);

  /* ───── save settings ───── */
  const handleSave = async () => {
    const token = authService.getToken();
    if (!token) {
      router.push('/');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const json = (await res.json()) as { success: boolean; message?: string };
      if (json.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Pengaturan jadwal kerja berhasil disimpan.',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: json.message || 'Gagal menyimpan pengaturan.',
        });
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan jaringan.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ───── shared styles ───── */
  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px 24px',
  };

  const sectionHeader: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoLabel: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
  };

  const infoValue: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1e293b',
  };

  /* ───── render ───── */
  return (
    <div style={{ padding: '32px 36px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
        Pengaturan
      </h1>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '28px' }}>
        Informasi sistem dan manajemen karyawan
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ─── Section 1: Profil Sistem ─── */}
        <div style={card}>
          <h2 style={sectionHeader}>
            <IconInfoCircle size={18} color="#1565c0" />
            Profil Sistem
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Nama Aplikasi', value: 'PresensiPortal' },
              { label: 'Versi', value: '1.0.0' },
              { label: 'Environment', value: 'Production' },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <span style={infoLabel}>{row.label}</span>
                <span style={infoValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 2: Manajemen Karyawan ─── */}
        <div style={card}>
          <h2 style={sectionHeader}>
            <IconUsers size={18} color="#1565c0" />
            Manajemen Karyawan
          </h2>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <IconLoader2 size={24} color="#1565c0" className="animate-spin" />
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>
                Memuat data karyawan...
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#ef4444' }}>{error}</p>
            </div>
          ) : karyawanList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Belum ada data karyawan.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['NIK', 'Nama', 'Role', 'Jabatan', 'Actions'].map((h) => (
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
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {karyawanList.map((emp) => {
                    const badgeColor = roleBadgeColor[emp.role] || '#475569';
                    return (
                      <tr key={emp.nik} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                          {emp.nik}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                          {emp.nama_karyawan}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: badgeColor,
                              background: badgeColor + '15',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {roleLabel[emp.role] || emp.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                          {emp.nama_jabatan}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => console.log('Delete', emp.nik)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ef4444',
                              background: '#fef2f2',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              cursor: 'pointer',
                            }}
                          >
                            <IconTrash size={13} />
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Section 3: Jadwal Kerja Default (editable) ─── */}
        <div style={card}>
          <h2 style={sectionHeader}>
            <IconClock size={18} color="#1565c0" />
            Jadwal Kerja Default
          </h2>

          {!isSettingsLoaded ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <IconLoader2 size={20} color="#1565c0" className="animate-spin" />
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px' }}>
                Memuat pengaturan...
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <label htmlFor="jam-masuk" style={infoLabel}>
                    Jam Masuk
                  </label>
                  <input
                    id="jam-masuk"
                    type="time"
                    value={settings.jam_masuk}
                    onChange={(e) => setSettings((prev) => ({ ...prev, jam_masuk: e.target.value }))}
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <label htmlFor="jam-pulang" style={infoLabel}>
                    Jam Pulang
                  </label>
                  <input
                    id="jam-pulang"
                    type="time"
                    value={settings.jam_pulang}
                    onChange={(e) => setSettings((prev) => ({ ...prev, jam_pulang: e.target.value }))}
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <label htmlFor="hari-libur" style={infoLabel}>
                    Hari Libur
                  </label>
                  <input
                    id="hari-libur"
                    type="text"
                    value={settings.hari_libur}
                    onChange={(e) => setSettings((prev) => ({ ...prev, hari_libur: e.target.value }))}
                    placeholder="Sabtu,Minggu"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1e293b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      outline: 'none',
                      width: '200px',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: isSaving ? '#93c5fd' : '#1565c0',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {isSaving ? (
                    <IconLoader2 size={15} className="animate-spin" />
                  ) : (
                    <IconDeviceFloppy size={15} />
                  )}
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
