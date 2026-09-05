"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function improveJobDescription(currentDescription: string, currentRequirements: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const prompt = `You are an expert HR copywriter. Improve the following job description and requirements.
Optimize for SEO, inclusive language, clear requirements, and professional grammar.

CURRENT DESCRIPTION:
${currentDescription}

CURRENT REQUIREMENTS:
${currentRequirements}

Return ONLY the improved text, formatted clearly with Markdown headings (e.g., ### About the Role, ### Key Responsibilities). Do not include any intro or conversational filler.`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
  });

  return { success: true, text };
}

export async function generateEmail(
  type: "rejection" | "offer" | "interview",
  applicationId: string,
  extraDetails?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      candidate: { include: { user: true } },
      interviews: true
    }
  });

  if (!application) throw new Error("Application not found");

  const candidateName = application.candidate.user.name;
  const jobTitle = application.job.title;
  const companyName = "NeuroHire AI"; // In a real app, fetch from user's company settings

  const systemPrompt = "You are an expert HR Coordinator generating professional ATS emails.";
  let userPrompt = `Generate a ${type} email for ${candidateName} who applied for the ${jobTitle} role at ${companyName}.`;

  if (extraDetails) {
    userPrompt += `\nInclude these specific details: ${extraDetails}`;
  }

  if (type === "offer") {
    userPrompt += `\nMention the salary is ${application.job.salary || "to be discussed"}. Keep it very welcoming and professional.`;
  }

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: userPrompt,
  });

  return { success: true, emailBody: text };
}
