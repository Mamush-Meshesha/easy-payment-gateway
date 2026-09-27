import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const providers = await prisma.paymentProvider.findMany();
    console.log("Providers:", providers);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main();
