import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ month: string; year: string; nik: string }> }
) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  const { month, year, nik } = await params;

  try {
    const pool = getPool();
    const userResult = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ success: false, message: 'Data karyawan tidak ditemukan.' }, { status: 404 });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    const attResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) as hadir,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as terlambat,
        COUNT(*) as total_hari
      FROM attendances
      WHERE user_id = $1 
        AND EXTRACT(MONTH FROM check_in) = $2 
        AND EXTRACT(YEAR FROM check_in) = $3`,
      [user.id, monthNum, yearNum]
    );

    const att = attResult.rows[0];
    const gajiPokok = 5000000;
    const tunjanganJabatan = 1000000;
    const tunjanganMasaKerja = 500000;
    const tunjanganTanggungJawab = 300000;
    const tunjanganMakan = 15000 * (parseInt(att.hadir) || 0);
    const tunjanganIstri = user.kategori_jabatan === 'Manager' ? 500000 : 0;
    const tunjanganSkill = 200000;
    const totalTunjangan = tunjanganJabatan + tunjanganMasaKerja + tunjanganTanggungJawab + tunjanganMakan + tunjanganIstri + tunjanganSkill;

    const jamKerja = (parseInt(att.hadir) || 0) * 9;
    const upahPerJam = Math.round(gajiPokok / 173);
    const upahBulan = upahPerJam * jamKerja;

    const overtime1Jam = Math.max(0, (parseInt(att.terlambat) || 0));
    const overtime1Upah = overtime1Jam * upahPerJam * 1.5;
    const overtime2Jam = 0;
    const overtime2Upah = 0;
    const overtimeLiburJam = 0;
    const overtimeLiburUpah = 0;

    const denda = overtime1Jam * 25000;
    const bpjsKes = 100000;
    const bpjsTk = 200000;

    const bruto = gajiPokok + totalTunjangan + upahBulan + overtime1Upah;
    const totalPotongan = denda + bpjsKes + bpjsTk;
    const netto = bruto - totalPotongan;

    return NextResponse.json({
      success: true,
      summary: {
        gaji_pokok: gajiPokok,
        tunjangan: {
          jabatan: tunjanganJabatan,
          masa_kerja: tunjanganMasaKerja,
          tanggung_jawab: tunjanganTanggungJawab,
          makan: tunjanganMakan,
          istri: tunjanganIstri,
          skill: tunjanganSkill,
        },
        insentif: { umum: 0, manager: user.kategori_jabatan === 'Manager' ? 500000 : 0, total: user.kategori_jabatan === 'Manager' ? 500000 : 0 },
        overtime: {
          jam_1: overtime1Jam,
          upah_1: overtime1Upah,
          jam_2: overtime2Jam,
          upah_2: overtime2Upah,
          jam_libur: overtimeLiburJam,
          upah_libur: overtimeLiburUpah,
          total_upah: overtime1Upah,
        },
        premi_shift: { shift_2_hari: 0, shift_2_upah: 0, shift_3_hari: 0, shift_3_upah: 0 },
        potongan: {
          jam_absensi: overtime1Jam,
          upah_absensi: denda,
          denda,
          bpjs_kesehatan: bpjsKes,
          bpjs_tk: bpjsTk,
          pjp: 0,
          kasbon: 0,
          piutang: 0,
          spip: 0,
          pengurang: 0,
          total: totalPotongan,
        },
        penambah: 0,
        bruto,
        netto,
        upah_perjam: upahPerJam,
        total_jam_kerja: jamKerja,
        masakerja: { tahun: 2, bulan: 5, hari: 0 },
      },
      employee: {
        nik: user.nik,
        nama_karyawan: user.name,
        kategori_jabatan: user.kategori_jabatan,
        nama_jabatan: user.kategori_jabatan,
        nama_dept: 'IT Department',
        nama_cabang: 'Pusat',
        kode_cabang: 'PST',
        kode_dept: 'IT',
        im_ruanglingkup: 0,
        im_penempatan: 0,
        im_kinerja: 0,
        im_kendaraan: 0,
        iu_masakerja: 0,
        iu_lembur: 0,
        iu_penempatan: 0,
        iu_kpi: 0,
      },
      start_date: startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      end_date: endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
