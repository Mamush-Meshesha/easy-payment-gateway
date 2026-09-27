import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const providers = [
    { code: 'TELEBIRR', name: 'Telebirr', type: 'MOBILE_MONEY' },
    { code: 'CBE_BIRR', name: 'CBE Birr', type: 'MOBILE_MONEY' },
    { code: 'VISA', name: 'Credit / Debit Cards', type: 'CARD' }
  ];

  for (const p of providers) {
    await prisma.paymentProvider.upsert({
      where: { code: p.code },
      update: {},
      create: p
    });
  }
  console.log('Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
