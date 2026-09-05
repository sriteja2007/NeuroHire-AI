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

const editJobSchema = createJobSchema.extend({
  id: z.string(),
  isActive: z.boolean().optional(),
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

export async function editJob(formData: FormData) {
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

  const data = editJobSchema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
    location: formData.get("location"),
    salary: formData.get("salary"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    isActive: formData.get("isActive") === "true",
  });

  // Verify ownership
  const existingJob = await prisma.job.findUnique({
    where: { id: data.id }
  });

  if (!existingJob || existingJob.companyId !== user.companyId) {
    throw new Error("Unauthorized or job not found");
  }

  const job = await prisma.job.update({
    where: { id: data.id },
    data: {
      title: data.title,
      location: data.location,
      salary: data.salary,
      description: data.description,
      requirements: data.requirements,
      isActive: data.isActive,
    }
  });

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${job.id}`);
  return { success: true, jobId: job.id };
}

export async function deleteJob(jobId: string) {
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

  const existingJob = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!existingJob || existingJob.companyId !== user.companyId) {
    throw new Error("Unauthorized or job not found");
  }

  await prisma.job.delete({
    where: { id: jobId }
  });

  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function updateJobStatus(jobId: string, isActive: boolean) {
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

  const existingJob = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!existingJob || existingJob.companyId !== user.companyId) {
    throw new Error("Unauthorized or job not found");
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { isActive }
  });

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return { success: true };
}

export async function duplicateJob(jobId: string) {
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

  const existingJob = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!existingJob || existingJob.companyId !== user.companyId) {
    throw new Error("Unauthorized or job not found");
  }

  const job = await prisma.job.create({
    data: {
      title: `${existingJob.title} (Copy)`,
      location: existingJob.location,
      salary: existingJob.salary,
      description: existingJob.description,
      requirements: existingJob.requirements,
      companyId: user.companyId,
      isActive: false, // Start as inactive by default
    }
  });

  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: job.id };
}
