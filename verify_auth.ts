import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neurohire.local';
  const plainPassword = 'Admin@123456';

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }

  console.log(`User found: ${user.email}`);
  
  if (!user.password) {
    console.error("User has no password set!");
    process.exit(1);
  }

  console.log(`Password hash in DB: ${user.password}`);

  const passwordsMatch = await bcrypt.compare(plainPassword, user.password);

  if (passwordsMatch) {
    console.log("SUCCESS: bcrypt.compare() matched!");
  } else {
    console.error("FAILURE: bcrypt.compare() did not match.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
