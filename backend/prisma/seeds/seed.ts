import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete old demo principal (Mu'minang NIP 2001)
  await prisma.user.deleteMany({
    where: {
      OR: [
        { nip: '2001' },
        { fullName: { contains: 'Mu\'minang', mode: 'insensitive' } }
      ]
    }
  });

  // 1. Master Sekolah
  const school = await prisma.school.upsert({
    where: { id: 'school-sd-inpres-pajjaiang-2' },
    update: {
      name: 'UPT SPF SD INPRES PAJJAIANG 2',
      address: 'Jl. Luwu Raya No.2 Perumnas Sudiang, Sudiang Raya, Kec. Biringkanaya, Kota Makassar',
      latitude: -5.1061803,
      longitude: 119.5345679,
      radiusMeters: 150.0
    },
    create: {
      id: 'school-sd-inpres-pajjaiang-2',
      name: 'UPT SPF SD INPRES PAJJAIANG 2',
      address: 'Jl. Luwu Raya No.2 Perumnas Sudiang, Sudiang Raya, Kec. Biringkanaya, Kota Makassar',
      latitude: -5.1061803,
      longitude: 119.5345679,
      radiusMeters: 150.0
    }
  });

  console.log(`✅ Master Sekolah Ter-update: ${school.name}`);

  const hashedPassword = await bcrypt.hash('password123', 12);

  // 2. Daftar 32 Pegawai Resmi UPT SPF SD INPRES PAJJAIANG 2
  const staffList = [
    // 1. KEPALA SEKOLAH / PIMPINAN
    {
      nip: '197402142011012001',
      fullName: 'HASNIAH T, S.Pd.',
      role: Role.PRINCIPAL,
      email: 'kepsek@sdinprespajjaiang2.sch.id',
      position: 'Guru Ahli Muda (Kepala Sekolah)',
      rankClass: 'III/d'
    },
    // 2. OPERATOR LAYANAN OPERASIONAL
    {
      nip: '199109262025212082',
      fullName: 'RINA ASRIANI',
      role: Role.ADMIN,
      email: 'operator@sdinprespajjaiang2.sch.id',
      position: 'Operator Layanan Operasional',
      rankClass: '-'
    },
    // 3 - 32. GURU PENGAJAR
    { nip: '196609051988032016', fullName: 'SITTI HASMIAH', role: Role.TEACHER, position: 'Guru Madya', rankClass: 'IV/b' },
    { nip: '196705031995012001', fullName: 'JUHRAWI', role: Role.TEACHER, position: 'Guru Ahli Madya', rankClass: 'IV/b' },
    { nip: '196712141992112001', fullName: 'ST HATIMAH', role: Role.TEACHER, position: 'Guru Madya', rankClass: 'IV/b' },
    { nip: '196712311989012014', fullName: 'MULIATI', role: Role.TEACHER, position: 'Guru Madya', rankClass: 'IV/b' },
    { nip: '196810021989031008', fullName: 'AHMADIAH', role: Role.TEACHER, position: 'Guru Madya', rankClass: 'IV/b' },
    { nip: '196905021988122001', fullName: 'FATMAWATI', role: Role.TEACHER, position: 'Guru Madya', rankClass: 'IV/b' },
    { nip: '196907181992082004', fullName: 'MARWIYAH', role: Role.TEACHER, position: 'Guru Ahli Madya', rankClass: 'IV/b' },
    { nip: '197112262024212001', fullName: 'ANDI ASDA', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '197310062024212002', fullName: 'HAPIDA', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '197405052023212005', fullName: 'SUMIATI DG. NGONTO', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '197607282024212004', fullName: 'HARLIAH', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '197610262022212006', fullName: 'RASMIAH', role: Role.TEACHER, position: 'Ahli Pertama - Guru Kelas', rankClass: 'III/a' },
    { nip: '197705242009032002', fullName: 'ZAINAB', role: Role.TEACHER, position: 'Guru Ahli Madya', rankClass: 'IV/b' },
    { nip: '198304162024212008', fullName: 'NURZADRA', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/a' },
    { nip: '198305072008012007', fullName: 'SUARNI SABRI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/c' },
    { nip: '198307112010012018', fullName: 'HASMIAH', role: Role.TEACHER, position: 'Guru Ahli Muda', rankClass: 'III/d' },
    { nip: '198310242022212018', fullName: 'ANDI HASTA RITAWATI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '198511122025212083', fullName: 'FIKA ARMITA', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: '-' },
    { nip: '198601152024212006', fullName: 'HASTRINA .T', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '198602012024212010', fullName: 'ANDI DAMAYANTI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '198604012019031003', fullName: 'MUHLIS', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/b' },
    { nip: '198701062024212008', fullName: 'IRAWATI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '198705202025212095', fullName: 'MEIGAWATI WAHAB', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: '-' },
    { nip: '199002212024211005', fullName: 'SYAMSIR', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '199008102024212020', fullName: 'NURLIAH', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/a' },
    { nip: '199307072022212024', fullName: 'RESKI AJENG PERTIWI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '199611102024211009', fullName: 'NASIR', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '199707142024211004', fullName: 'IQBAL EKA YULIANTO', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'IX' },
    { nip: '199801252024212015', fullName: 'MUTMAINNAH AL GAZALI', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/a' },
    { nip: '199912192024211004', fullName: 'SLAMET RIYADI DJIDE', role: Role.TEACHER, position: 'Guru Ahli Pertama', rankClass: 'III/a' }
  ];

  for (const staff of staffList) {
    const email = staff.email || `${staff.fullName.toLowerCase().replace(/[^a-z]/g, '')}.${staff.nip.substring(staff.nip.length - 4)}@sdinprespajjaiang2.sch.id`;

    const user = await prisma.user.upsert({
      where: { nip: staff.nip },
      update: {
        fullName: staff.fullName,
        role: staff.role,
        email: email,
        isActive: true
      },
      create: {
        nip: staff.nip,
        email: email,
        password: hashedPassword,
        fullName: staff.fullName,
        role: staff.role,
        phone: '085200000000',
        isActive: true
      }
    });

    if (staff.role === Role.TEACHER || staff.role === Role.PRINCIPAL) {
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
          workShiftStart: '07:00',
          workShiftEnd: '15:00'
        }
      });
    }
  }

  console.log(`✅ Sukses Mendaftarkan 32 Pegawai Resmi UPT SPF SD INPRES PAJJAIANG 2 ke Database PostgreSQL!`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
