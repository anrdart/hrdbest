const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Employee {
  nik: string;
  nama_karyawan: string;
  nama_jabatan?: string;
  nama_dept?: string;
  nama_cabang?: string;
  [key: string]: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  employee?: Employee;
}

export interface ProfileResponse {
  success: boolean;
  data: Employee;
}

export interface AttendanceHistory {
  tanggal: string;
  hari: string;
  jam_in: string | null;
  jam_out: string | null;
  status: 'h' | 'i' | 's' | 'c';
  terlambat_min: number;
  pulang_cepat_min: number;
  denda: number;
  keterangan: string;
}

export interface AttendanceHistoryResponse {
  success: boolean;
  data: AttendanceHistory[];
}

export interface AttendanceSummary {
  hadir: number;
  izin: number;
  sisa_cuti: number;
}

export interface AttendanceSummaryResponse {
  success: boolean;
  data: AttendanceSummary;
}

export interface AttendanceCek {
  id: number;
  nik: string;
  tanggal: string;
  jam_in: string | null;
  jam_out: string | null;
  foto_in: string | null;
  foto_out: string | null;
  lokasi_in: string | null;
  lokasi_out: string | null;
  kode_jadwal: string;
  kode_jam_kerja: string;
  status: string;
}

export interface LokasiKantor {
  kode_cabang: string;
  nama_cabang: string;
  lokasi_cabang: string;
  radius_cabang: number;
}

export interface JamKerja {
  kode_jam_kerja: string;
  nama_jam_kerja: string;
  jam_masuk: string;
  jam_pulang: string;
  lintashari: string;
}

export interface JadwalKerja {
  kode_jadwal: string;
  nama_jadwal: string;
  hari: string;
  kode_jam_kerja: string;
}

export interface AttendanceTodayData {
  cek: AttendanceCek | null;
  lok_kantor: LokasiKantor;
  jam_kerja: JamKerja;
  jadwal: JadwalKerja;
  status_libur: boolean;
  status_wfh: boolean;
  status_libur_pengganti: boolean;
}

export interface AttendanceTodayResponse {
  success: boolean;
  data: AttendanceTodayData;
}

export interface SlipMonth {
  month: number;
  month_name: string;
  year: number;
}

export interface SlipMonthResponse {
  success: boolean;
  data: SlipMonth[];
}

export interface SlipSummary {
  upah: number;
  gaji_pokok: number;
  tunjangan: {
    jabatan: number;
    masa_kerja: number;
    tanggung_jawab: number;
    makan: number;
    istri: number;
    skill: number;
  };
  insentif: {
    umum: number;
    manager: number;
    total: number;
  };
  overtime: {
    jam_1: number;
    upah_1: number;
    jam_2: number;
    upah_2: number;
    jam_libur: number;
    upah_libur: number;
    total_upah: number;
  };
  premi_shift: {
    shift_2_hari: number;
    shift_2_upah: number;
    shift_3_hari: number;
    shift_3_upah: number;
  };
  potongan: {
    jam_absensi: number;
    upah_absensi: number;
    denda: number;
    bpjs_kesehatan: number;
    bpjs_tk: number;
    pjp: number;
    kasbon: number;
    piutang: number;
    spip: number;
    pengurang: number;
    total: number;
  };
  penambah: number;
  bruto: number;
  netto: number;
  upah_perjam: number;
  total_jam_kerja: number;
  masakerja: {
    tahun: number;
    bulan: number;
    hari: number;
  };
}

export interface SlipDetailResponse {
  success: boolean;
  summary: SlipSummary;
  employee: Employee;
  start_date: string;
  end_date: string;
}

export interface Pinjaman {
  no_pinjaman: string;
  tanggal: string;
  jumlah_pinjaman: number;
  angsuran: number;
  jumlah_angsuran: number;
  status: string;
  tipe_pinjaman: 'PJP' | 'KASBON' | 'PIUTANG';
  total_bayar: number;
  sisa_pinjaman: number;
}

export interface PinjamanHistory {
  no_bukti: string;
  tanggal: string;
  jumlah: number;
  keterangan: string | null;
  cicilan_ke?: number;
}

export interface PinjamanResponse {
  success: boolean;
  data: Pinjaman[];
  summary: {
    total_sisa: number;
  };
}

export interface PinjamanDetailResponse {
  success: boolean;
  loan: Pinjaman;
  history: PinjamanHistory[];
}

export interface PjpSimulationRules {
  success: boolean;
  data: {
    tenor_max: number;
    angsuran_max: number;
    plafon_max: number;
    is_eligible: boolean;
    messages: string[];
    employee_info: {
      nama: string;
      status: string;
      masakerja: string;
    };
  };
}

export interface IzinRecord {
  id: string;
  tanggal: string;
  dari: string;
  sampai: string;
  keterangan: string;
  status: number;
  tipe: string;
}

export interface IzinFormData {
  success: boolean;
  data: {
    jenis_cuti: Array<{ kode_cuti: string; nama_cuti: string }>;
    jenis_cuti_khusus: Array<{ kode_cuti_khusus: string; nama_cuti_khusus: string }>;
    cabang: Array<{ kode_cabang: string; nama_cabang: string }>;
  };
}

export const authService = {
  async login(nik: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login-karyawan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ nik, password }),
      credentials: 'include',
    });

    return response.json();
  },

  async getProfile(token: string): Promise<ProfileResponse> {
    const response = await fetch(`${API_URL}/me-karyawan`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  async getAttendanceHistory(token: string, month?: number, year?: number): Promise<AttendanceHistoryResponse> {
    console.log('Fetching history with token starting with:', token.substring(0, 10) + '...');
    
    let url = `${API_URL}/attendance-history`;
    if (month && year) {
      url += `?bulan=${month}&tahun=${year}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Attendance History Error [${response.status}]:`, errorBody);
      throw new Error(`Failed to fetch attendance history: ${response.status}`);
    }

    return response.json();
  },

  async getAttendanceSummary(token: string): Promise<AttendanceSummaryResponse> {
    const response = await fetch(`${API_URL}/attendance-summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance summary: ${response.status}`);
    }

    return response.json();
  },

  async getAttendanceToday(token: string): Promise<AttendanceTodayResponse> {
    const response = await fetch(`${API_URL}/attendance-today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch attendance today: ${response.status}`);
    }

    return response.json();
  },

  async storeAttendance(token: string, data: { lokasi: string; statuspresensi: 'masuk' | 'pulang'; image: string }): Promise<{ success: boolean; message: string; type?: string }> {
    const response = await fetch(`${API_URL}/attendance-store`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    return response.json();
  },

  async getSlipMonths(token: string): Promise<SlipMonthResponse> {
    const response = await fetch(`${API_URL}/slipgaji-months`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch slip months: ${response.status}`);
    }

    return response.json();
  },

  async getSlipDetail(token: string, month: number, year: number, nik: string): Promise<SlipDetailResponse> {
    const response = await fetch(`${API_URL}/slipgaji/${month}/${year}/${nik}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch slip detail: ${response.status}`);
    }

    return response.json();
  },

  async getPinjaman(token: string): Promise<PinjamanResponse> {
    const response = await fetch(`${API_URL}/pinjaman`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch loans: ${response.status}`);
    }

    return response.json();
  },

  async getPinjamanDetail(token: string, type: string, id: string): Promise<PinjamanDetailResponse> {
    const response = await fetch(`${API_URL}/pinjaman/${type}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch loan detail: ${response.status}`);
    }

    return response.json();
  },

  async getPjpSimulationRules(token: string): Promise<PjpSimulationRules> {
    const response = await fetch(`${API_URL}/pinjaman-simulation-rules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch simulation rules: ${response.status}`);
    }

    return response.json();
  },

  async getIzin(token: string): Promise<{ success: boolean; data: IzinRecord[] }> {
    const response = await fetch(`${API_URL}/izin`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch izin: ${response.status}`);
    }

    return response.json();
  },

  async getIzinFormData(token: string): Promise<IzinFormData> {
    const response = await fetch(`${API_URL}/izin/form-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch izin form data: ${response.status}`);
    }

    return response.json();
  },

  async storeIzin(token: string, formData: FormData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/izin/store`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal menyimpan pengajuan');
    }

    return response.json();
  },

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/logout-karyawan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    return response.json();
  },

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  setUserData(data: Employee) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(data));
    }
  },

  getUserData(): Employee | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('user_data');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }
};
