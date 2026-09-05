import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai"; // Assumes OpenAI API key is in env as OPENAI_API_KEY

export const ResumeSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  linkedin: z.string().nullable(),
  github: z.string().nullable(),
  portfolio: z.string().nullable(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string().nullable(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
  })),
  certifications: z.array(z.string()),
  skills: z.array(z.string()),
  softSkills: z.array(z.string()),
  technicalSkills: z.array(z.string()),
  languages: z.array(z.string()),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().nullable(),
  })),
  workExperience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    description: z.string(),
  })),
  achievements: z.array(z.string()),
  yearsOfExperience: z.number().nullable(),
  currentCompany: z.string().nullable(),
  previousCompanies: z.array(z.string()),
});

export type ParsedResume = z.infer<typeof ResumeSchema>;

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: ResumeSchema,
    system: "You are an expert ATS (Applicant Tracking System) resume parser. Your job is to extract highly structured JSON from the raw text of a candidate's resume.",
    prompt: `Parse the following resume text and extract all information accurately:\n\n${text}`,
  });

  return object;
}
