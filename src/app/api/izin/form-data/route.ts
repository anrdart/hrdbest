import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  return NextResponse.json({
    success: true,
    data: {
      jenis_cuti: [
        { kode_cuti: 'CT', nama_cuti: 'Cuti Tahunan' },
        { kode_cuti: 'CB', nama_cuti: 'Cuti Besar' },
        { kode_cuti: 'CS', nama_cuti: 'Cuti Sakit' },
      ],
      jenis_cuti_khusus: [
        { kode_cuti_khusus: 'MEL', nama_cuti_khusus: 'Melahirkan' },
        { kode_cuti_khusus: 'KKG', nama_cuti_khusus: 'Keguguran' },
        { kode_cuti_khusus: 'IST', nama_cuti_khusus: 'Istri Melahirkan' },
      ],
      cabang: [
        { kode_cabang: 'PST', nama_cabang: 'Kantor Pusat' },
        { kode_cabang: 'CAB1', nama_cabang: 'Cabang 1' },
      ],
    },
  });
}
