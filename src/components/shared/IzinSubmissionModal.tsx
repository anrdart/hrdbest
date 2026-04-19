import { useState, useEffect, useMemo } from 'react';
import { authService, IzinFormData } from '@/services/auth.service';
import { 
  IconX, 
  IconCalendar, 
  IconClock, 
  IconMapPin, 
  IconUpload, 
  IconCheck, 
  IconStethoscope,
  IconMoodEmpty,
  IconBriefcase,
  IconLogout,
  IconWalk,
  IconBeach,
  IconChevronRight
} from '@tabler/icons-react';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface IzinSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  onSuccess: () => void;
}

const TimeSplitPicker = ({ 
  value, 
  onChange,
  disabled = false
}: { 
  value: Date | null, 
  onChange: (d: Date) => void,
  disabled?: boolean
}) => {
  const date = value || new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const selectStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '15px',
    fontWeight: 700,
    background: '#ffffff',
    color: '#1e293b',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center'
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
        <select 
          value={hours}
          disabled={disabled}
          onChange={(e) => {
            const newDate = new Date(date);
            newDate.setHours(parseInt(e.target.value));
            onChange(newDate);
          }}
          style={selectStyle}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
      <span style={{ fontWeight: 800, color: '#cbd5e1' }}>:</span>
      <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
        <select 
          value={minutes}
          disabled={disabled}
          onChange={(e) => {
            const newDate = new Date(date);
            newDate.setMinutes(parseInt(e.target.value));
            onChange(newDate);
          }}
          style={selectStyle}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default function IzinSubmissionModal({ isOpen, onClose, type, onSuccess }: IzinSubmissionModalProps) {
  const [formData, setFormData] = useState<IzinFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [tanggal, setTanggal] = useState<Date>(new Date());
  const [dari, setDari] = useState<Date>(new Date());
  const [sampai, setSampai] = useState<Date>(new Date());
  const [keterangan, setKeterangan] = useState('');
  const [kodeCuti, setKodeCuti] = useState('');
  const [kodeCutiKhusus, setKodeCutiKhusus] = useState('');
  const [kodeCabangTujuan, setKodeCabangTujuan] = useState('');
  const [jam, setJam] = useState<Date>(new Date(new Date().setHours(8, 0, 0, 0)));
  const [jamKeluar, setJamKeluar] = useState<Date>(new Date(new Date().setHours(8, 0, 0, 0)));
  const [jamKembali, setJamKembali] = useState<Date | null>(new Date(new Date().setHours(17, 0, 0, 0)));
  const [keperluan, setKeperluan] = useState('P');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const token = authService.getToken();
          if (token) {
            const res = await authService.getIzinFormData(token);
            setFormData(res);
            if (res.data.jenis_cuti.length > 0) setKodeCuti(res.data.jenis_cuti[0].kode_cuti);
            if (res.data.cabang.length > 0) setKodeCabangTujuan(res.data.cabang[0].kode_cabang);
            if (res.data.jenis_cuti_khusus.length > 0) setKodeCutiKhusus(res.data.jenis_cuti_khusus[0].kode_cuti_khusus);
          }
        } catch (error) {
          console.error('Failed to fetch form data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Calculate total days
  const totalDays = useMemo(() => {
    if (['sakit', 'absen', 'cuti', 'dinas'].includes(type)) {
      const diff = differenceInDays(startOfDay(sampai), startOfDay(dari)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 1;
  }, [dari, sampai, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = authService.getToken();
      if (!token) return;

      const submitData = new FormData();
      submitData.append('type', type);
      submitData.append('tanggal', format(tanggal, 'yyyy-MM-dd'));
      submitData.append('keterangan', keterangan);

      if (['sakit', 'absen', 'cuti', 'dinas'].includes(type)) {
        submitData.append('dari', format(dari, 'yyyy-MM-dd'));
        submitData.append('sampai', format(sampai, 'yyyy-MM-dd'));
      }

      if (type === 'cuti') {
        submitData.append('kode_cuti', kodeCuti);
        if (kodeCuti === 'C03') submitData.append('kode_cuti_khusus', kodeCutiKhusus);
      }

      if (type === 'dinas') {
        submitData.append('kode_cabang_tujuan', kodeCabangTujuan);
      }

      if (type === 'pulang') {
        submitData.append('jam', format(jam, 'HH:mm'));
      }

      if (type === 'keluar') {
        submitData.append('jam_keluar', format(jamKeluar, 'HH:mm'));
        if (jamKembali) submitData.append('jam_kembali', format(jamKembali, 'HH:mm'));
        submitData.append('keperluan', keperluan);
      }

      if (file) {
        submitData.append('file', file);
      }

      const res = await authService.storeIzin(token, submitData);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.message,
          timer: 2000,
          showConfirmButton: false
        });
        onSuccess();
        onClose();
        resetForm();
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.message || 'Gagal menyimpan pengajuan'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTanggal(new Date());
    setDari(new Date());
    setSampai(new Date());
    setJam(new Date(new Date().setHours(8, 0, 0, 0)));
    setJamKeluar(new Date(new Date().setHours(8, 0, 0, 0)));
    setJamKembali(new Date(new Date().setHours(17, 0, 0, 0)));
    setKeterangan('');
    setFile(null);
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'sakit': return 'Izin Sakit';
      case 'absen': return 'Izin Absen';
      case 'cuti': return 'Izin Cuti';
      case 'dinas': return 'Izin Dinas';
      case 'pulang': return 'Izin Pulang';
      case 'keluar': return 'Izin Keluar';
      default: return 'Pengajuan Izin';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'sakit': return <IconStethoscope size={24} />;
      case 'absen': return <IconMoodEmpty size={24} />;
      case 'cuti': return <IconBeach size={24} />;
      case 'dinas': return <IconBriefcase size={24} />;
      case 'pulang': return <IconLogout size={24} />;
      case 'keluar': return <IconWalk size={24} />;
      default: return <IconCalendar size={24} />;
    }
  };

  const themeColor = () => {
    switch (type) {
      case 'sakit': return '#ef4444';
      case 'absen': return '#f59e0b';
      case 'cuti': return '#3b82f6';
      case 'dinas': return '#10b981';
      case 'pulang': return '#8b5cf6';
      case 'keluar': return '#6366f1';
      default: return '#1565c0';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          background: '#f8fafc',
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          padding: '24px',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: '40px', height: '5px', background: '#cbd5e1', borderRadius: '10px', margin: '0 auto 20px' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '14px', 
              background: `${themeColor()}15`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: themeColor()
            }}>
              {getIcon()}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{getTitle()}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Silakan lengkapi formulir pengajuan</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconX size={20} color="#64748b" />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: '36px', height: '36px', border: '4px solid #e2e8f0', borderTopColor: themeColor(), borderRadius: '50%', margin: '0 auto 16px' }}></div>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Menyiapkan formulir...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Tanggal Detail Card */}
            <div style={{ 
              background: 'white', 
              borderRadius: '20px', 
              padding: '20px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '16px' }}>Waktu Pengajuan</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <IconCalendar size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Tanggal Pengajuan</p>
                    <DatePicker
                      selected={tanggal}
                      onChange={(date: Date | null) => setTanggal(date || new Date())}
                      dateFormat="dd MMMM yyyy"
                      locale={id}
                      className="date-picker-input-custom"
                    />
                  </div>
                </div>

                {['sakit', 'absen', 'cuti', 'dinas'].includes(type) && (
                  <>
                    <div style={{ height: '1px', background: '#f1f5f9' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Mulai Dari</p>
                          <DatePicker
                            selected={dari}
                            onChange={(date: Date | null) => {
                              const selected = date || new Date();
                              setDari(selected);
                              if (isBefore(sampai, selected)) {
                                setSampai(selected);
                              }
                            }}
                            dateFormat="dd MMM yyyy"
                            locale={id}
                            className="date-picker-input-custom"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: "0 0 0 12px", fontWeight: 600, textTransform: 'uppercase' }}>Sampai Dengan</p>
                          <DatePicker
                            selected={sampai}
                            onChange={(date: Date | null) => setSampai(date || new Date())}
                            minDate={dari}
                            dateFormat="dd MMM yyyy"
                            locale={id}
                            className="date-picker-input-custom"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge Jumlah Hari */}
                    <div style={{ 
                      marginTop: '8px', 
                      background: `${themeColor()}10`, 
                      padding: '12px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: `1px solid ${themeColor()}20`
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Estimasi Jumlah Hari:</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: themeColor() }}>{totalDays} Hari</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Opsi & Keterangan Card */}
            <div style={{ 
              background: 'white', 
              borderRadius: '20px', 
              padding: '20px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              
              {/* Cuti Specific Fields */}
              {type === 'cuti' && (
                <>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Pilih Jenis Cuti</label>
                    <select
                      value={kodeCuti}
                      onChange={(e) => setKodeCuti(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#f8fafc' }}
                    >
                      {formData?.data.jenis_cuti.map(x => (
                        <option key={x.kode_cuti} value={x.kode_cuti}>{x.nama_cuti}</option>
                      ))}
                    </select>
                  </div>
                  {kodeCuti === 'C03' && (
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Kategori Cuti Khusus</label>
                      <select
                        value={kodeCutiKhusus}
                        onChange={(e) => setKodeCutiKhusus(e.target.value)}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#f8fafc' }}
                      >
                        {formData?.data.jenis_cuti_khusus.map(x => (
                          <option key={x.kode_cuti_khusus} value={x.kode_cuti_khusus}>{x.nama_cuti_khusus}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Dinas Specific */}
              {type === 'dinas' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Cabang Tujuan Dinas</label>
                  <select
                    value={kodeCabangTujuan}
                    onChange={(e) => setKodeCabangTujuan(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#f8fafc' }}
                  >
                    {formData?.data.cabang.map(x => (
                      <option key={x.kode_cabang} value={x.kode_cabang}>{x.nama_cabang}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pulang Specific */}
              {type === 'pulang' && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '12px' }}>Tentukan Jam Pulang</label>
                  <div style={{ padding: '4px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconClock size={20} color="#1565c0" />
                    <TimeSplitPicker value={jam} onChange={setJam} />
                  </div>
                </div>
              )}

              {/* Keluar Specific */}
              {type === 'keluar' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '12px' }}>Jam Keluar</label>
                      <div style={{ padding: '4px 8px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        <TimeSplitPicker value={jamKeluar} onChange={setJamKeluar} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '12px' }}>Jam Kembali</label>
                      <div style={{ padding: '4px 8px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        <TimeSplitPicker value={jamKembali} onChange={setJamKembali} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Sifat Keperluan</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      {['P', 'K'].map((k) => (
                        <label key={k} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          cursor: 'pointer',
                          padding: '10px 16px',
                          borderRadius: '12px',
                          background: keperluan === k ? `${themeColor()}10` : '#f8fafc',
                          border: `1.5px solid ${keperluan === k ? themeColor() : '#e2e8f0'}`,
                          flex: 1
                        }}>
                          <input 
                            type="radio" 
                            name="keperluan" 
                            value={k} 
                            checked={keperluan === k} 
                            onChange={() => setKeperluan(k)}
                            style={{ accentColor: themeColor() }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: keperluan === k ? themeColor() : '#64748b' }}>
                            {k === 'P' ? 'Pribadi' : 'Kantor'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Keterangan */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>Keterangan / Alasan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Berikan alasan pengajuan Anda secara lengkap..."
                  rows={4}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#f8fafc', resize: 'none' }}
                  required
                />
              </div>

              {/* File Upload Animation Improvements */}
              {['sakit', 'cuti', 'dinas'].includes(type) && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' }}>
                    {type === 'sakit' ? 'Unggah Surat Istirahat Dokter (SID)' : 'Dokumen Lampiran (Opsional)'}
                  </label>
                  <div 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    style={{ 
                      border: '2px dashed #cbd5e1', 
                      borderRadius: '16px', 
                      padding: '24px 20px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      background: file ? '#f0fdf4' : '#f8fafc',
                      borderColor: file ? '#22c55e' : '#cbd5e1',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input 
                      id="file-upload" 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }} 
                    />
                    {file ? (
                      <div style={{ color: '#16a34a' }}>
                        <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                          <IconCheck size={24} />
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{file.name}</p>
                        <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>Klik untuk ganti file</p>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8' }}>
                        <IconUpload size={28} style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px 0' }}>Tap untuk pilih dokumen</p>
                        <p style={{ fontSize: '11px', margin: 0 }}>JPG, PNG, atau PDF (Maks. 2MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '18px',
                border: 'none',
                background: themeColor(),
                color: 'white',
                fontSize: '16px',
                fontWeight: 800,
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: `0 10px 20px -5px ${themeColor()}40`
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <span>Kirim Pengajuan</span>
                  <IconChevronRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        <style jsx global>{`
          .date-picker-input-custom {
            width: 100%;
            border: none;
            background: transparent;
            font-size: 15px;
            font-weight: 700;
            color: #1e293b;
            padding: 2px 0;
            outline: none;
            cursor: pointer;
          }
          .react-datepicker-wrapper {
            width: 100%;
          }
          .react-datepicker {
            font-family: inherit;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          }
          .react-datepicker__header {
            background-color: white;
            border-bottom: 1px solid #f1f5f9;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            padding: 12px 0;
          }
          .react-datepicker__day--selected {
            background-color: ${themeColor()} !important;
            border-radius: 50%;
          }
          .react-datepicker__day--keyboard-selected {
            background-color: ${themeColor()}20;
            color: ${themeColor()};
          }
        `}</style>
      </div>
    </div>
  );
}
