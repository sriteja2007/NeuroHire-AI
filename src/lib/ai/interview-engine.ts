import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

export const InterviewQuestionsSchema = z.object({
  technical: z.array(z.string()),
  behavioral: z.array(z.string()),
  problemSolving: z.array(z.string()),
  leadership: z.array(z.string()),
  communication: z.array(z.string()),
  followUp: z.array(z.string()),
});

export const InterviewFeedbackSchema = z.object({
  overallPerformance: z.string().describe("A professional summary of how the candidate performed overall."),
  communicationScore: z.number().describe("0-100 score."),
  technicalScore: z.number().describe("0-100 score."),
  confidenceScore: z.number().describe("0-100 score."),
  problemSolvingScore: z.number().describe("0-100 score."),
  recommendation: z.enum(["HIRE", "NO_HIRE", "FOLLOW_UP"]).describe("Final recommendation based on interview."),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestedNextSteps: z.string(),
});

export async function generateInterviewQuestions(
  jobDescription: string,
  resumeJson: any,
  difficulty: "Easy" | "Medium" | "Hard"
) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: InterviewQuestionsSchema,
    system: "You are an expert technical and behavioral recruiter. Generate highly relevant interview questions based on the candidate's resume and job description.",
    prompt: `Job Description:\n${jobDescription}\n\nCandidate Resume:\n${JSON.stringify(resumeJson, null, 2)}\n\nDifficulty Level: ${difficulty}\n\nGenerate structured interview questions in the required categories. Make them specific to the candidate's experience and the job's requirements.`,
  });

  return object;
}

export async function generateInterviewFeedback(
  jobDescription: string,
  resumeJson: any,
  transcript: string
) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: InterviewFeedbackSchema,
    system: "You are an expert interviewer. Analyze the provided interview notes or transcript and evaluate the candidate.",
    prompt: `Job Description:\n${jobDescription}\n\nCandidate Resume:\n${JSON.stringify(resumeJson, null, 2)}\n\nInterview Notes/Transcript:\n${transcript}\n\nEvaluate the candidate and provide structured feedback.`,
  });

  return object;
}
