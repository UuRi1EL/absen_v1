import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.school.updateMany({
    data: {
      latitude: -5.1061803,
      longitude: 119.5345679
    }
  });

  console.log(`✓ Berhasil memperbarui koordinat fisik asli SD INPRES PAJJAIANG 2 di Database menjadi (-5.1061803, 119.5345679). (${updated.count} record).`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
