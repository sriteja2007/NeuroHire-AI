const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const company = await prisma.company.upsert({
    where: { id: "cm01company" },
    update: {},
    create: {
      id: "cm01company",
      name: "Acme Corp",
      website: "https://acmecorp.com",
      description: "Leading the way in cartoon anvils.",
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@acme.com" },
    update: {},
    create: {
      name: "Wile E. Coyote",
      email: "recruiter@acme.com",
      password: hashedPassword,
      role: "RECRUITER",
      companyId: company.id,
    },
  });

  const job = await prisma.job.create({
    data: {
      title: "Senior Road Runner Catcher",
      description: "Looking for an experienced engineer to build traps.",
      requirements: "- 5+ years building traps\n- Expertise in TNT",
      location: "Desert, USA",
      salary: "$100k - $150k",
      companyId: company.id,
    },
  });

  console.log({ company, recruiter, job });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
