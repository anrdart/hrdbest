import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// PUT: Update employee by NIK
export async function PUT(req: NextRequest, context: { params: Promise<{ nik: string }> }) {
  try {
    const decoded = verifyToken(req);
    if (!decoded || (decoded.role !== 'super_admin' && decoded.role !== 'hrd')) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { nik } = await context.params;
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      role?: string;
      kategori_jabatan?: string;
    };

    const pool = getPool();
    const currentRes = await pool.query('SELECT email FROM users WHERE nik = $1', [nik]);
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    const currentEmail = currentRes.rows[0].email as string;

    if (body.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(body.name);
    }
    if (body.email !== undefined) {
      // Check uniqueness if email changes
      if (body.email !== currentEmail) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND nik <> $2', [body.email, nik]);
        if (emailCheck.rows.length > 0) {
          return NextResponse.json({ success: false, message: 'Email sudah terdaftar' }, { status: 400 });
        }
      }
      updates.push(`email = $${idx++}`);
      values.push(body.email);
    }
    if (body.role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(body.role);
    }
    if (body.kategori_jabatan !== undefined) {
      updates.push(`kategori_jabatan = $${idx++}`);
      values.push(body.kategori_jabatan);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada perubahan yang diberikan' }, { status: 400 });
    }

    const setClause = updates.join(', ');
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE nik = $${idx} RETURNING id, nik, name, email, role, kategori_jabatan`;
    values.push(nik);
    const updateRes = await pool.query(query, values);
    if (updateRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Gagal memperbarui' }, { status: 500 });
    }
    const updatedUser = updateRes.rows[0];
    return NextResponse.json({ success: true, message: 'Karyawan berhasil diperbarui', data: updatedUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE: Delete employee by NIK
export async function DELETE(req: NextRequest, context: { params: Promise<{ nik: string }> }) {
  try {
    // Ensure the requester is allowed to delete
    const decoded = verifyToken(req);
    if (!decoded || (decoded.role !== 'super_admin' && decoded.role !== 'hrd')) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { nik } = await context.params;
    // Prevent self-deletion if token contains nik
    if (decoded.nik && decoded.nik === nik) {
      return NextResponse.json({ success: false, message: 'Tidak bisa menghapus diri sendiri' }, { status: 403 });
    }

    const pool = getPool();
    const delRes = await pool.query('DELETE FROM users WHERE nik = $1 RETURNING id', [nik]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Karyawan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Karyawan berhasil dihapus' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
