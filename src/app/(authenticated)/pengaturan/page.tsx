'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  IconInfoCircle,
  IconUsers,
  IconClock,
  IconTrash,
  IconLoader2,
  IconDeviceFloppy,
  IconMapPin,
  IconCurrentLocation,
} from '@tabler/icons-react';
import Swal from 'sweetalert2';
import { authService } from '@/services/auth.service';
import 'leaflet/dist/leaflet.css';

/* ── lazy-load komponen leaflet (no SSR) ── */
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import('react-leaflet').then((m) => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import('react-leaflet').then((m) => m.Marker),       { ssr: false });
const Circle       = dynamic(() => import('react-leaflet').then((m) => m.Circle),       { ssr: false });
const Popup        = dynamic(() => import('react-leaflet').then((m) => m.Popup),        { ssr: false });


/* ── komponen dalam map untuk capture click ── */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useMapEvents } = require('react-leaflet') as typeof import('react-leaflet');
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ── komponen untuk auto-recenter saat koordinat berubah ── */
function MapRecenterer({ lat, lng }: { lat: number; lng: number }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useMap } = require('react-leaflet') as typeof import('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

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
  office_lat: string;
  office_lng: string;
  office_radius: string;
  office_name: string;
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
    office_lat: '-6.200000',
    office_lng: '106.816666',
    office_radius: '100',
    office_name: 'Kantor Pusat',
  });
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const officeLat = parseFloat(settings.office_lat) || -6.2;
  const officeLng = parseFloat(settings.office_lng) || 106.816666;
  const officeRadius = parseInt(settings.office_radius) || 100;

  const handleMapClick = (lat: number, lng: number) => {
    setSettings((prev) => ({
      ...prev,
      office_lat: lat.toFixed(7),
      office_lng: lng.toFixed(7),
    }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          office_lat: pos.coords.latitude.toFixed(7),
          office_lng: pos.coords.longitude.toFixed(7),
        }));
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

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
          office_lat: json.data.office_lat || '-6.200000',
          office_lng: json.data.office_lng || '106.816666',
          office_radius: json.data.office_radius || '100',
          office_name: json.data.office_name || 'Kantor Pusat',
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
                {[
                  { id: 'jam-masuk', label: 'Jam Masuk', key: 'jam_masuk' as const, type: 'time', placeholder: '' },
                  { id: 'jam-pulang', label: 'Jam Pulang', key: 'jam_pulang' as const, type: 'time', placeholder: '' },
                  { id: 'hari-libur', label: 'Hari Libur', key: 'hari_libur' as const, type: 'text', placeholder: 'Sabtu,Minggu' },
                ].map(({ id, label, key, type, placeholder }) => (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <label htmlFor={id} style={infoLabel}>{label}</label>
                    <input
                      id={id}
                      type={type}
                      value={settings[key]}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        outline: 'none',
                        width: type === 'text' ? '200px' : 'auto',
                        textAlign: type === 'text' ? 'right' : 'left',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ─── Section 4: Lokasi Kantor (untuk mobile QR & GPS) ─── */}
        <div style={card}>
          <h2 style={sectionHeader}>
            <IconMapPin size={18} color="#0891b2" />
            Lokasi Kantor
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            Digunakan oleh aplikasi mobile untuk validasi GPS dan scan QR absensi.{' '}
            <strong style={{ color: '#0891b2' }}>Klik pada peta</strong> untuk menentukan titik kantor, atau gunakan tombol GPS.
          </p>

          {!isSettingsLoaded ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <IconLoader2 size={20} color="#0891b2" className="animate-spin" />
            </div>
          ) : (
            <>
              {/* Peta interaktif */}
              {isMounted && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <MapContainer
                    center={[officeLat, officeLng]}
                    zoom={17}
                    style={{ height: '320px', width: '100%' }}
                    scrollWheelZoom
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    <MapRecenterer lat={officeLat} lng={officeLng} />
                    <Marker position={[officeLat, officeLng]}>
                      <Popup>{settings.office_name || 'Kantor'}</Popup>
                    </Marker>
                    <Circle
                      center={[officeLat, officeLng]}
                      radius={officeRadius}
                      pathOptions={{ color: '#0891b2', fillColor: '#0891b2', fillOpacity: 0.12, weight: 2 }}
                    />
                  </MapContainer>
                </div>
              )}

              {/* Tombol GPS */}
              <div style={{ marginBottom: '14px' }}>
                <button
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0891b2',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: isLocating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLocating
                    ? <IconLoader2 size={14} className="animate-spin" />
                    : <IconCurrentLocation size={14} />}
                  {isLocating ? 'Mendapatkan lokasi...' : 'Gunakan Lokasi Saya Sekarang'}
                </button>
              </div>

              {/* Input fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { id: 'office-name',   label: 'Nama Kantor',           key: 'office_name'   as const, placeholder: 'Kantor Pusat' },
                  { id: 'office-lat',    label: 'Latitude',               key: 'office_lat'    as const, placeholder: '-6.2001234' },
                  { id: 'office-lng',    label: 'Longitude',              key: 'office_lng'    as const, placeholder: '106.8166789' },
                  { id: 'office-radius', label: 'Radius Absensi (meter)', key: 'office_radius' as const, placeholder: '100' },
                ].map(({ id, label, key, placeholder }) => (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    <label htmlFor={id} style={infoLabel}>{label}</label>
                    <input
                      id={id}
                      type="text"
                      value={settings[key]}
                      onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
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
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                ))}
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
                    background: isSaving ? '#67e8f9' : '#0891b2',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {isSaving ? <IconLoader2 size={15} className="animate-spin" /> : <IconDeviceFloppy size={15} />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Lokasi'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
