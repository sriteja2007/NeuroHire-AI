import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { generateMatchScore, generateAiSummary } from "@/lib/ai/match-engine";

export const processResume = (inngest as any).createFunction(
  { id: "process-resume", triggers: [{ event: "app/resume.uploaded" }] },
  async ({ event, step }: any) => {
    const { applicationId } = event.data;
    
    await step.run("generate-ai-insights", async () => {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, resume: true }
      });

      if (!application || !application.resume?.parsedData) {
        return { message: "No application or resume found to process" };
      }

      // Generate Match Data
      const matchData = await generateMatchScore(
        application.resume.parsedData, 
        application.job.description, 
        application.job.requirements
      );

      // Generate Recruiter Summary
      const aiSummary = await generateAiSummary(
        application.resume.parsedData,
        application.job.description,
        matchData
      );

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          matchScore: matchData.overallMatchScore,
          matchData: matchData as any,
          aiSummary: aiSummary as any
        }
      });
    });

    return { success: true };
  }
);
