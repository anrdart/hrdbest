'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import Swal from 'sweetalert2';
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconKey,
  IconLoader2,
  IconSearch,
  IconX,
} from '@tabler/icons-react';

/* ───── types ───── */
interface KaryawanItem {
  id: number;
  nik: string;
  name: string;
  email: string;
  role: string;
  kategori_jabatan: string | null;
  created_at?: string;
}

/* ───── helpers ───── */
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: '#f5f3ff', color: '#7c3aed' },
  hrd: { bg: '#eff6ff', color: '#1565c0' },
  manager: { bg: '#ecfeff', color: '#0891b2' },
  employee: { bg: '#f1f5f9', color: '#475569' },
};

function roleBadge(role: string) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.employee;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '6px',
        background: c.bg,
        color: c.color,
      }}
    >
      {role}
    </span>
  );
}

/* ───── page ───── */
export default function KaryawanPage() {
  const router = useRouter();

  const [karyawanList, setKaryawanList] = useState<KaryawanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKaryawan, setEditingKaryawan] = useState<KaryawanItem | null>(null);
  const [formNik, setFormNik] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('employee');
  const [formJabatan, setFormJabatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── fetch ─── */
  const fetchKaryawan = async () => {
    const token = authService.getToken();
    if (!token) { router.push('/'); return; }
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/karyawan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setKaryawanList(data.data);
      } else {
        setError(data.message || 'Gagal memuat data');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (!token) { router.push('/'); return; }
    fetchKaryawan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ─── helpers ─── */
  const resetForm = () => {
    setFormNik('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('employee');
    setFormJabatan('');
    setIsSubmitting(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (k: KaryawanItem) => {
    resetForm();
    setEditingKaryawan(k);
    setFormNik(k.nik);
    setFormName(k.name);
    setFormEmail(k.email);
    setFormRole(k.role);
    setFormJabatan(k.kategori_jabatan || '');
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingKaryawan(null);
    resetForm();
  };

  /* ─── CRUD handlers ─── */
  const handleAdd = async () => {
    if (!formNik || !formName || !formEmail || !formPassword) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Form', text: 'NIK, Nama, Email, dan Password wajib diisi.', confirmButtonColor: '#1565c0' });
      return;
    }
    if (formPassword.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Password Terlalu Pendek', text: 'Minimal 6 karakter.', confirmButtonColor: '#1565c0' });
      return;
    }
    const token = authService.getToken();
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/karyawan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nik: formNik, name: formName, email: formEmail, password: formPassword, role: formRole, kategori_jabatan: formJabatan }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        closeModals();
        fetchKaryawan();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1565c0' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: '#ef4444' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingKaryawan) return;
    if (!formName || !formEmail) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Form', text: 'Nama dan Email wajib diisi.', confirmButtonColor: '#1565c0' });
      return;
    }
    const token = authService.getToken();
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/karyawan/${editingKaryawan.nik}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: formName, email: formEmail, role: formRole, kategori_jabatan: formJabatan }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        closeModals();
        fetchKaryawan();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#1565c0' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: '#ef4444' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (nik: string, name: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Karyawan?',
      html: `<p style="margin:0">Anda yakin ingin menghapus <strong>${name}</strong> (${nik})?</p><p style="margin:8px 0 0;color:#94a3b8;font-size:13px">Tindakan ini tidak bisa dibatalkan.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;
    const token = authService.getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/karyawan/${nik}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        fetchKaryawan();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#ef4444' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: '#ef4444' });
    }
  };

  const handleResetPassword = async (nik: string, name: string) => {
    const result = await Swal.fire({
      title: 'Reset Password',
      html: `<p style="margin:0 0 12px;font-size:14px;color:#475569">Reset password untuk <strong>${name}</strong> (${nik})</p>`,
      input: 'password',
      inputLabel: 'Password Baru',
      inputPlaceholder: 'Minimal 6 karakter',
      inputAttributes: { minlength: '6', autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonColor: '#1565c0',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Reset Password',
      cancelButtonText: 'Batal',
      inputValidator: (value: string) => {
        if (!value) return 'Password wajib diisi';
        if (value.length < 6) return 'Password minimal 6 karakter';
        return undefined;
      },
    });
    if (!result.isConfirmed) return;
    const token = authService.getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/karyawan/${nik}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: result.value }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message, confirmButtonColor: '#ef4444' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Terjadi kesalahan jaringan', confirmButtonColor: '#ef4444' });
    }
  };

  /* ─── derived ─── */
  const filtered = karyawanList.filter((k) => {
    const q = searchQuery.toLowerCase();
    return k.name.toLowerCase().includes(q) || k.nik.toLowerCase().includes(q);
  });

  const totalHrd = karyawanList.filter((k) => k.role === 'hrd').length;
  const totalManager = karyawanList.filter((k) => k.role === 'manager').length;

  /* ─── render ─── */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <IconLoader2 size={32} color="#1565c0" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconUsers size={24} color="#1565c0" />
            Manajemen Karyawan
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Kelola data karyawan, role, dan akses sistem.</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#1565c0', color: '#ffffff',
            border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <IconPlus size={16} />
          Tambah Karyawan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Karyawan', value: karyawanList.length, icon: <IconUsers size={20} color="#1565c0" />, bg: '#eff6ff', accent: '#1565c0' },
          { label: 'Total HRD', value: totalHrd, icon: <IconUsers size={20} color="#7c3aed" />, bg: '#f5f3ff', accent: '#7c3aed' },
          { label: 'Total Manager', value: totalManager, icon: <IconUsers size={20} color="#0891b2" />, bg: '#ecfeff', accent: '#0891b2' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: s.accent }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <IconSearch size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau NIK..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 14px 10px 40px',
            fontSize: '13px', color: '#1e293b',
            background: '#ffffff', border: '1px solid #e2e8f0',
            borderRadius: '10px', outline: 'none',
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <IconX size={14} color="#94a3b8" />
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <IconUsers size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
              {searchQuery ? 'Tidak ada karyawan yang cocok dengan pencarian.' : 'Belum ada data karyawan.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['No', 'NIK', 'Nama', 'Email', 'Role', 'Jabatan', 'Aksi'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: h === 'Aksi' ? 'center' : 'left', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, idx) => (
                  <tr key={k.nik} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>{k.nik}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1e293b' }}>{k.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{k.email}</td>
                    <td style={{ padding: '12px 16px' }}>{roleBadge(k.role)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{k.kategori_jabatan || '-'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(k)}
                          title="Edit"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', color: '#1565c0' }}
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.nik, k.name)}
                          title="Hapus"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #fecaca', background: '#ffffff', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <IconTrash size={15} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(k.nik, k.name)}
                          title="Reset Password"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', color: '#f59e0b' }}
                        >
                          <IconKey size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={closeModals}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Tambah Karyawan</h2>
              <button onClick={closeModals} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}><IconX size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FieldInput label="NIK" value={formNik} onChange={setFormNik} placeholder="Nomor Induk Karyawan" />
              <FieldInput label="Nama" value={formName} onChange={setFormName} placeholder="Nama Lengkap" />
              <FieldInput label="Email" value={formEmail} onChange={setFormEmail} placeholder="email@perusahaan.com" type="email" />
              <FieldInput label="Password" value={formPassword} onChange={setFormPassword} placeholder="Minimal 6 karakter" type="password" />
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Role</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13px', color: '#1e293b', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}>
                  <option value="employee">Employee</option>
                  <option value="hrd">HRD</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <FieldInput label="Jabatan" value={formJabatan} onChange={setFormJabatan} placeholder="Kategori Jabatan (opsional)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button onClick={closeModals} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleAdd} disabled={isSubmitting} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', background: '#1565c0', color: '#ffffff', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting && <IconLoader2 size={14} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {showEditModal && editingKaryawan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={closeModals}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Edit Karyawan</h2>
              <button onClick={closeModals} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}><IconX size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>NIK</label>
                <input value={formNik} disabled style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13px', color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }} />
              </div>
              <FieldInput label="Nama" value={formName} onChange={setFormName} placeholder="Nama Lengkap" />
              <FieldInput label="Email" value={formEmail} onChange={setFormEmail} placeholder="email@perusahaan.com" type="email" />
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Role</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13px', color: '#1e293b', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}>
                  <option value="employee">Employee</option>
                  <option value="hrd">HRD</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <FieldInput label="Jabatan" value={formJabatan} onChange={setFormJabatan} placeholder="Kategori Jabatan (opsional)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button onClick={closeModals} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#64748b', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleEdit} disabled={isSubmitting} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', border: 'none', background: '#1565c0', color: '#ffffff', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting && <IconLoader2 size={14} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── reusable form field ───── */
function FieldInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: '13px', color: '#1e293b', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
      />
    </div>
  );
}
