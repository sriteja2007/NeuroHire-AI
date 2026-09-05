"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { generateInterviewQuestions, generateInterviewFeedback } from "@/lib/ai/interview-engine";

export async function createAiInterviewQuestions(applicationId: string, difficulty: "Easy" | "Medium" | "Hard" = "Medium") {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true, resume: true }
  });

  if (!application || !application.resume?.parsedData) {
    throw new Error("Application or Resume data not found");
  }

  const questions = await generateInterviewQuestions(
    application.job.description,
    application.resume.parsedData,
    difficulty
  );

  // We can either create a new Interview record or update an existing one. Let's create one.
  const interview = await prisma.interview.create({
    data: {
      applicationId: applicationId,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
      aiQuestions: questions as any,
    }
  });

  revalidatePath(`/dashboard/applications/${applicationId}`);
  return { success: true, interviewId: interview.id };
}

export async function createAiInterviewFeedback(interviewId: string, transcript: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: true, resume: true } } }
  });

  if (!interview || !interview.application.resume?.parsedData) {
    throw new Error("Interview or Resume data not found");
  }

  const feedback = await generateInterviewFeedback(
    interview.application.job.description,
    interview.application.resume.parsedData,
    transcript
  );

  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      transcript: transcript,
      aiFeedback: feedback as any,
      status: "COMPLETED",
      score: (feedback.technicalScore + feedback.communicationScore + feedback.problemSolvingScore) / 3
    }
  });

  revalidatePath(`/dashboard/applications/${interview.applicationId}`);
  return { success: true };
}
