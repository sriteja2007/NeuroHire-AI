"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { unstable_cache } from "next/cache";

async function fetchAndGenerateInsights(companyId: string) {
  const jobs = await prisma.job.findMany({
    where: { companyId, isActive: true },
    include: {
      applications: {
        select: { matchScore: true, status: true }
      }
    }
  });

  const totalJobs = jobs.length;
  const totalApps = jobs.reduce((acc, job) => acc + job.applications.length, 0);
  
  // Prepare a summary of the data for the AI
  const jobStats = jobs.map(j => {
    const scores = j.applications.map(a => a.matchScore).filter(s => s !== null) as number[];
    const avgScore = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : "N/A";
    return `${j.title}: ${j.applications.length} apps, Avg Match: ${avgScore}%`;
  }).join("\n");

  const prompt = `You are the AI Recruitment Assistant for NeuroHire. Analyze the following real-time ATS data and provide a concise, insightful 2-3 sentence summary for the recruiter's dashboard. Point out any trends, warnings (like low match scores), or recommendations.

Total Active Jobs: ${totalJobs}
Total Applications: ${totalApps}

Breakdown:
${jobStats}

Write the insight paragraph directly without any greetings or filler.`;

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
  });

  return text;
}

export async function getDashboardAiInsights() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    return null;
  }

  // Use Next.js unstable_cache to cache the AI response per company for 12 hours (43200 seconds)
  // This satisfies Phase 10: Performance / Caching requirements
  const getCachedInsights = unstable_cache(
    async (cid: string) => fetchAndGenerateInsights(cid),
    [`dashboard-insights-${user.companyId}`],
    { revalidate: 43200 } // 12 hours
  );

  try {
    return await getCachedInsights(user.companyId);
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    return "AI Insights are currently unavailable. Please check back later.";
  }
}
