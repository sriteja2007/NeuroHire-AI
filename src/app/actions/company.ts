"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCompanyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const website = formData.get("website") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Company name is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true }
  });

  if (!user) throw new Error("User not found");

  if (user.company) {
    await prisma.company.update({
      where: { id: user.company.id },
      data: { name, website, description }
    });
  } else {
    await prisma.company.create({
      data: {
        name,
        website,
        description,
        users: { connect: { id: user.id } }
      }
    });
  }

  revalidatePath("/dashboard/company");
  return { success: true };
}
