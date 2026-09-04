"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const createJobSchema = z.object({
  title: z.string().min(3),
  location: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().min(10),
  requirements: z.string().min(10),
});

export async function createJob(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    throw new Error("Unauthorized");
  }

  const data = createJobSchema.parse({
    title: formData.get("title"),
    location: formData.get("location"),
    salary: formData.get("salary"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
  });

  const job = await prisma.job.create({
    data: {
      ...data,
      companyId: user.companyId,
    }
  });

  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: job.id };
}
