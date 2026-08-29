import app from './app.js';
import { env } from './config/env.config.js';
import { prisma } from './config/database.config.js';
import bcrypt from 'bcryptjs';

const PORT = env.PORT;

async function syncDatabaseMasterData() {
  try {
    const oldNips = ['1001', '2001', '3001', '3002', '3003', '199109262025212082'];

    // 0. Purge ALL foreign key child records including AuditLog and LeaveRequest approvedBy
    await prisma.auditLog.deleteMany({
      where: { user: { nip: { in: oldNips } } }
    });

    await prisma.attendance.deleteMany({
      where: { user: { nip: { in: oldNips } } }
    });

    await prisma.teacherProfile.deleteMany({
      where: { user: { nip: { in: oldNips } } }
    });

    await prisma.leaveRequest.deleteMany({
      where: {
        OR: [
          { teacher: { nip: { in: oldNips } } },
          { approvedBy: { nip: { in: oldNips } } }
        ]
      }
    });

    await prisma.refreshToken.deleteMany({
      where: { user: { nip: { in: oldNips } } }
    });

    // Delete users with short demo NIPs or old demo names
    await prisma.user.deleteMany({
      where: {
        OR: [
          { nip: { in: oldNips } },
          { fullName: { contains: 'Operator', mode: 'insensitive' } },
          { fullName: { contains: 'Mu\'minang', mode: 'insensitive' } }
        ]
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. School Master Data (Preserve admin GPS settings across server restarts)
    const school = await prisma.school.upsert({
      where: { id: 'school-sd-inpres-pajjaiang-2' },
      update: {},
      create: {
        id: 'school-sd-inpres-pajjaiang-2',
        name: 'UPT SPF SD INPRES PAJJAIANG 2',
        address: 'Jl. Luwu Raya No.2 Perumnas Sudiang, Sudiang Raya, Kec. Biringkanaya, Kota Makassar',
        latitude: -5.1061803,
        longitude: 119.5345679,
        radiusMeters: 150.0,
        operatorPhone: '085298499891'
      }
    });

    // 2. Official 32 Staff Accounts
    const staffList = [
      { nip: '197402142011012001', fullName: 'HASNIAH T, S.Pd.', role: 'PRINCIPAL', email: 'kepsek@sdinprespajjaiang2.sch.id', position: 'Guru Ahli Muda (Kepala Sekolah)', rankClass: 'III/d' },
      { nip: 'ADMIN', fullName: 'Admin System', role: 'ADMIN', email: 'admin@sdinprespajjaiang2.sch.id', position: 'Administrator System', rankClass: '-' },
      { nip: '196609051988032016', fullName: 'SITTI HASMIAH', role: 'TEACHER', position: 'Guru Madya', rankClass: 'IV/b' },
      { nip: '196705031995012001', fullName: 'JUHRAWI', role: 'TEACHER', position: 'Guru Ahli Madya', rankClass: 'IV/b' },
      { nip: '196712141992112001', fullName: 'ST HATIMAH', role: 'TEACHER', position: 'Guru Madya', rankClass: 'IV/b' },
      { nip: '196712311989012014', fullName: 'MULIATI', role: 'TEACHER', position: 'Guru Madya', rankClass: 'IV/b' },
      { nip: '196810021989031008', fullName: 'AHMADIAH', role: 'TEACHER', position: 'Guru Madya', rankClass: 'IV/b' },
      { nip: '196905021988122001', fullName: 'FATMAWATI', role: 'TEACHER', position: 'Guru Madya', rankClass: 'IV/b' },
      { nip: '196907181992082004', fullName: 'MARWIYAH', role: 'TEACHER', position: 'Guru Ahli Madya', rankClass: 'IV/b' },
      { nip: '197112262024212001', fullName: 'ANDI ASDA', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '197310062024212002', fullName: 'HAPIDA', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '197405052023212005', fullName: 'SUMIATI DG. NGONTO', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '197607282024212004', fullName: 'HARLIAH', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '197610262022212006', fullName: 'RASMIAH', role: 'TEACHER', position: 'Ahli Pertama - Guru Kelas', rankClass: 'III/a' },
      { nip: '197705242009032002', fullName: 'ZAINAB', role: 'TEACHER', position: 'Guru Ahli Madya', rankClass: 'IV/b' },
      { nip: '198304162024212008', fullName: 'NURZADRA', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/a' },
      { nip: '198305072008012007', fullName: 'SUARNI SABRI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/c' },
      { nip: '198307112010012018', fullName: 'HASMIAH', role: 'TEACHER', position: 'Guru Ahli Muda', rankClass: 'III/d' },
      { nip: '198310242022212018', fullName: 'ANDI HASTA RITAWATI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '198511122025212083', fullName: 'FIKA ARMITA', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: '-' },
      { nip: '198601152024212006', fullName: 'HASTRINA .T', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '198602012024212010', fullName: 'ANDI DAMAYANTI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '198604012019031003', fullName: 'MUHLIS', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/b' },
      { nip: '198701062024212008', fullName: 'IRAWATI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '198705202025212095', fullName: 'MEIGAWATI WAHAB', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: '-' },
      { nip: '199002212024211005', fullName: 'SYAMSIR', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '199008102024212020', fullName: 'NURLIAH', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/a' },
      { nip: '199307072022212024', fullName: 'RESKI AJENG PERTIWI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '199611102024211009', fullName: 'NASIR', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '199707142024211004', fullName: 'IQBAL EKA YULIANTO', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'IX' },
      { nip: '199801252024212015', fullName: 'MUTMAINNAH AL GAZALI', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/a' },
      { nip: '199912192024211004', fullName: 'SLAMET RIYADI DJIDE', role: 'TEACHER', position: 'Guru Ahli Pertama', rankClass: 'III/a' }
    ];

    for (const staff of staffList) {
      try {
        const email = staff.email || `${staff.fullName.toLowerCase().replace(/[^a-z]/g, '')}.${staff.nip.substring(staff.nip.length - 4)}@sdinprespajjaiang2.sch.id`;

        const user = await prisma.user.upsert({
          where: { nip: staff.nip },
          update: {
            fullName: staff.fullName,
            role: staff.role as any,
            email: email,
            isActive: true
          },
          create: {
            nip: staff.nip,
            email: email,
            password: hashedPassword,
            fullName: staff.fullName,
            role: staff.role as any,
            phone: '085200000000',
            isActive: true
          }
        });

        if (staff.role === 'TEACHER' || staff.role === 'PRINCIPAL') {
          await prisma.teacherProfile.upsert({
            where: { userId: user.id },
            update: {
              position: `${staff.position} (${staff.rankClass})`,
              department: 'Tenaga Pendidik'
            },
            create: {
              userId: user.id,
              schoolId: school.id,
              position: `${staff.position} (${staff.rankClass})`,
              department: 'Tenaga Pendidik',
              workShiftStart: '07:30',
              workShiftEnd: '15:00'
            }
          });
        }
      } catch (staffErr) {
        console.error(`Warning sync staff ${staff.fullName}:`, staffErr);
      }
    }
  } catch (err) {
    console.error('⚠️ DB Sync warning:', err);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  🏫 UPT SPF SD INPRES PAJJAIANG 2 - MAKASSAR                         ║
║  🚀 SISTEM PRESENSI GURU & KEPALA SEKOLAH (ONLINE BACKEND)           ║
╠══════════════════════════════════════════════════════════════════════╣
║  📡 URL API SERVER : http://0.0.0.0:${PORT}/api/v1                      ║
║  🌐 LOCAL NETWORK  : http://192.168.1.53:${PORT}/api/v1                 ║
║  📍 GEOLOCATION    : -5.1061803, 119.5345679 (Radius 150m)            ║
║  🔧 RUNNING MODE   : ${env.NODE_ENV.toUpperCase()}                                  ║
║  🔒 DATABASE STATUS: POSTGRESQL CONNECTED & READY                   ║
╚══════════════════════════════════════════════════════════════════════╝
`);
  
  await syncDatabaseMasterData();
});
