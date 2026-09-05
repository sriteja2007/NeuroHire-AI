"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function uploadResume(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Assuming candidate is uploading their own resume
  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id }
  });

  if (!candidate) {
    throw new Error("Candidate profile not found");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  // Basic validation
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit");
  }

  if (file.type !== "application/pdf" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    throw new Error("Only PDF and DOCX files are supported");
  }

  // Simulate file upload (in a real app, upload to S3/Cloudinary and get URL)
  const fileUrl = `/uploads/${file.name}`;
  
  // Save to database
  const resume = await prisma.resume.create({
    data: {
      candidateId: candidate.id,
      fileName: file.name,
      fileUrl: fileUrl,
      parsedData: "{}" // Simulated parsing
    }
  });

  revalidatePath("/dashboard/candidates");
  return { success: true, resumeId: resume.id };
}

export async function deleteResume(resumeId: string) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id }
  });

  if (!candidate) {
    throw new Error("Candidate profile not found");
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId }
  });

  if (!resume || resume.candidateId !== candidate.id) {
    throw new Error("Unauthorized or resume not found");
  }

  await prisma.resume.delete({
    where: { id: resumeId }
  });

  revalidatePath("/dashboard/candidates");
  return { success: true };
}
