"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
import { parseResumeText } from "@/lib/ai/resume-parser";

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

  // Extract text from PDF
  let text = "";
  if (file.type === "application/pdf") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    text = pdfData.text;
  } else {
    // Basic fallback for non-PDF, could implement docx parsing later
    text = await file.text();
  }

  // Parse with OpenAI
  let parsedData = null;
  if (text.trim()) {
    try {
      parsedData = await parseResumeText(text);
    } catch (e) {
      console.error("Failed to parse resume with AI:", e);
    }
  }

  // Simulate file upload (in a real app, upload to S3/Cloudinary and get URL)
  const fileUrl = `/uploads/${file.name}`;
  
  // Save to database
  const resume = await prisma.resume.create({
    data: {
      candidateId: candidate.id,
      fileName: file.name,
      fileUrl: fileUrl,
      parsedData: parsedData as any
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
