import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function parseResumeWithAI(resumeText: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        skills: z.array(z.string()).describe("List of technical and soft skills extracted from the resume."),
        experienceYears: z.number().describe("Total years of professional experience calculated from the resume."),
        education: z.string().describe("Highest level of education achieved."),
        summary: z.string().describe("A 2-3 sentence summary of the candidate's profile."),
      }),
      prompt: `Extract structured data from the following resume text:\n\n${resumeText}`,
    });
    return object;
  } catch (error) {
    console.error("AI Parse Error:", error);
    // Fallback if API key is not set or request fails
    return {
      skills: ["Parsing Error"],
      experienceYears: 0,
      education: "Unknown",
      summary: "Could not parse resume with AI.",
    };
  }
}

export async function calculateMatchScore(candidateSkills: string[], jobRequirements: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        score: z.number().describe("A match score between 0 and 100."),
        reasoning: z.string().describe("Why this score was given based on the alignment of skills to requirements."),
      }),
      prompt: `Given the following candidate skills:\n${candidateSkills.join(", ")}\n\nAnd the following job requirements:\n${jobRequirements}\n\nCalculate a match score from 0 to 100 based on how well the candidate fits the requirements.`,
    });
    return object;
  } catch (error) {
    console.error("AI Match Error:", error);
    return { score: 50, reasoning: "AI Error: Could not calculate match." };
  }
}
