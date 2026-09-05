"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { generateMatchScore, generateAiSummary } from "@/lib/ai/match-engine";

export async function updateApplicationStatus(applicationId: string, status: string) {
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

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true }
  });

  if (!application || application.job.companyId !== user.companyId) {
    throw new Error("Unauthorized or application not found");
  }

  // Ensure valid status
  const validStatuses = ["PENDING", "REVIEWING", "INTERVIEW", "REJECTED", "HIRED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status }
  });

  revalidatePath(`/dashboard/jobs/${application.jobId}`);
  return { success: true };
}

export async function generateApplicationInsights(applicationId: string) {
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

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true, resume: true }
  });

  if (!application || application.job.companyId !== user.companyId || !application.resume?.parsedData) {
    throw new Error("Unauthorized or missing parsed resume data");
  }

  // Generate Match Data
  const matchData = await generateMatchScore(
    application.resume.parsedData, 
    application.job.description, 
    application.job.requirements
  );

  // Generate Recruiter Summary
  const aiSummary = await generateAiSummary(
    application.resume.parsedData,
    application.job.description,
    matchData
  );

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      matchScore: matchData.overallMatchScore,
      matchData: matchData as any,
      aiSummary: aiSummary as any
    }
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { success: true };
}
