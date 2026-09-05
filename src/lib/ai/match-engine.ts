import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

export const MatchSchema = z.object({
  overallMatchScore: z.number().describe("0 to 100 representing how well the candidate fits the job."),
  skillMatchScore: z.number().describe("0 to 100 based strictly on hard/technical skills matching."),
  experienceMatchScore: z.number().describe("0 to 100 based on years of experience and relevance of previous roles."),
  missingSkills: z.array(z.string()).describe("Key skills required by the job that the candidate lacks."),
  strengths: z.array(z.string()).describe("Top 3-5 reasons why this candidate is a strong fit."),
  weaknesses: z.array(z.string()).describe("Top 2-3 areas where the candidate falls short."),
  atsCompatibility: z.string().describe("Brief note on how well the resume is formatted for ATS (e.g., 'Good', 'Poor formatting')."),
});

export const SummarySchema = z.object({
  candidateSummary: z.string().describe("A 3-4 sentence professional summary of the candidate for the recruiter."),
  whyFit: z.string().describe("Why this candidate is a good fit for this specific role."),
  whyNotFit: z.string().describe("Potential risks or reasons why this candidate might struggle in this role."),
  recommendedInterviewTopics: z.array(z.string()).describe("Specific topics or technical areas to probe during an interview."),
  hiringRecommendation: z.enum(["STRONG_YES", "YES", "MAYBE", "NO"]).describe("Final recommendation for the recruiter."),
});

export type MatchData = z.infer<typeof MatchSchema>;
export type AiSummary = z.infer<typeof SummarySchema>;

export async function generateMatchScore(resumeJson: any, jobDescription: string, jobRequirements: string): Promise<MatchData> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: MatchSchema,
    system: "You are an expert AI Recruiter and ATS engine. Compare the candidate's parsed resume against the job description and requirements to generate a highly accurate, explainable match score.",
    prompt: `Job Description:\n${jobDescription}\n\nRequirements:\n${jobRequirements}\n\nCandidate Resume (JSON):\n${JSON.stringify(resumeJson, null, 2)}\n\nAnalyze the fit and generate the match data.`,
  });

  return object;
}

export async function generateAiSummary(resumeJson: any, jobDescription: string, matchData: MatchData): Promise<AiSummary> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: SummarySchema,
    system: "You are an expert Executive Recruiter. Write a summary to present to the hiring manager.",
    prompt: `Job Description:\n${jobDescription}\n\nCandidate Resume:\n${JSON.stringify(resumeJson, null, 2)}\n\nATS Match Data:\n${JSON.stringify(matchData, null, 2)}\n\nBased on this, generate a comprehensive recruiter summary.`,
  });

  return object;
}
