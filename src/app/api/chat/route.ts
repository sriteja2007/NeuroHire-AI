/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const maxDuration = 60; // Next.js serverless limit

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "You are an expert AI Recruitment Copilot built into the NeuroHire ATS. You can query the database for candidates, jobs, and applications to assist the recruiter. Be concise, highly professional, and use markdown for readability.",
    messages,
    tools: {
      getJobs: tool({
        description: "Get all active jobs for the recruiter's company.",
        parameters: z.object({}),
        execute: async ({}) => {
          const jobs = await prisma.job.findMany({
            where: { companyId: user.companyId, isActive: true },
            select: { id: true, title: true, location: true, _count: { select: { applications: true } } }
          });
          return jobs;
        }
      }),
      getTopCandidates: tool({
        description: "Get the top candidates for a specific job based on AI match score.",
        parameters: z.object({
          jobId: z.string().describe("The ID of the job."),
          limit: z.number().optional().default(5).describe("How many top candidates to return.")
        }),
        execute: async ({ jobId, limit }: { jobId: string; limit: number }) => {
          const apps = await prisma.application.findMany({
            where: { jobId: jobId, job: { companyId: user.companyId } },
            orderBy: { matchScore: 'desc' },
            take: limit,
            include: { candidate: { include: { user: { select: { name: true, email: true } } } } }
          });
          return apps.map(app => ({
            applicationId: app.id,
            candidateName: app.candidate.user.name,
            matchScore: app.matchScore,
            status: app.status
          }));
        }
      }),
      getCandidateDetails: tool({
        description: "Get the full parsed resume and summary of a candidate application.",
        parameters: z.object({
          applicationId: z.string().describe("The ID of the application.")
        }),
        execute: async ({ applicationId }: { applicationId: string }) => {
          const app = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { job: true, resume: true, candidate: { include: { user: true } } }
          });
          if (!app || app.job?.companyId !== user.companyId) return "Unauthorized or Not Found";
          return {
            name: app.candidate.user.name,
            matchScore: app.matchScore,
            summary: app.aiSummary,
            resumeData: app.resume?.parsedData
          };
        }
      }),
      generateEmail: tool({
        description: "Generate an email for a candidate (rejection, offer, interview). You can write the draft directly to the user.",
        parameters: z.object({
          type: z.enum(["rejection", "offer", "interview", "followup"]),
          candidateName: z.string(),
          jobTitle: z.string(),
          extraContext: z.string().optional()
        }),
        execute: async ({ type, candidateName, jobTitle, extraContext }: { type: string; candidateName: string; jobTitle: string; extraContext?: string }) => {
          // In a real app we might trigger a server action here to actually send it or save as draft.
          // For the chat, just returning confirmation that we should generate the text.
          return `I will generate a ${type} email for ${candidateName} applying for ${jobTitle}. Context: ${extraContext || "None"}.`;
        }
      })
    }
  });

  return result.toTextStreamResponse();
}
