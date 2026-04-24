import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  const { type, id } = await params;

  return NextResponse.json({
    success: true,
    loan: {
      no_pinjaman: id,
      tanggal: new Date().toISOString(),
      jumlah_pinjaman: 0,
      angsuran: 0,
      jumlah_angsuran: 0,
      status: 'lunas',
      tipe_pinjaman: type as 'PJP' | 'KASBON' | 'PIUTANG',
      total_bayar: 0,
      sisa_pinjaman: 0,
    },
    history: [],
  });
}
