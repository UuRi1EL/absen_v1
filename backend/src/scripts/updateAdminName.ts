import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: {
      OR: [
        { nip: 'ADMIN' },
        { email: 'operator@sdinprespajjaiang2.sch.id' },
        { role: 'ADMIN' }
      ]
    },
    data: {
      fullName: 'RINA ASRIANI'
    }
  });

  console.log(`✓ Berhasil memperbarui nama Operator/Admin di Database menjadi RINA ASRIANI (${updated.count} record).`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
