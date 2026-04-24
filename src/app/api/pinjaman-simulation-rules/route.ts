import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  return NextResponse.json({
    success: true,
    data: {
      tenor_max: 12,
      angsuran_max: 500000,
      plafon_max: 10000000,
      is_eligible: true,
      messages: ['Anda memenuhi syarat untuk mengajukan pinjaman.'],
      employee_info: {
        nama: 'Karyawan',
        status: 'Aktif',
        masakerja: '2 Tahun 5 Bulan',
      },
    },
  });
}
