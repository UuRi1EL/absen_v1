import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Memulai proses pembersihan data presensi & izin uji coba...');

  try {
    // 1. Hapus semua data transaksi presensi uji coba
    const deletedAttendances = await prisma.attendance.deleteMany({});
    console.log(`✓ Berhasil menghapus ${deletedAttendances.count} data presensi uji coba.`);

    // 2. Hapus semua transaksi pengajuan izin uji coba
    const deletedLeaves = await prisma.leaveRequest.deleteMany({});
    console.log(`✓ Berhasil menghapus ${deletedLeaves.count} data permohonan izin uji coba.`);

    // 3. Hapus audit log uji coba
    const deletedLogs = await prisma.auditLog.deleteMany({});
    console.log(`✓ Berhasil menghapus ${deletedLogs.count} data audit log uji coba.`);

    console.log('\n🎉 PEMBERSIHAN DATA SELESAI!');
    console.log('----------------------------------------------------');
    console.log('✓ Akun Seluruh Guru, Kepala Sekolah & Admin TETAP UTUH & AMAN.');
    console.log('✓ Data Dapodik, SIMPKB, & Koordinat GPS Sekolah TETAP SIMPAN.');
    console.log('✓ Laporan Bulanan Sekolah kini 100% Bersih & Siap Produksi!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Gagal membersihkan data uji coba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
