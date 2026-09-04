import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest as NextServerRequest } from "next/server";
import { parseResumeWithAI, calculateMatchScore } from "@/services/ai";

export async function POST(req: NextServerRequest) {
  try {
    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const resumeFile = formData.get("resume") as File;

    if (!jobId || !name || !email || !resumeFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Convert File to Buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text
    const pdfParse = require("pdf-parse");
    const pdfData = await pdfParse(buffer);
    const textContent = pdfData.text;

    // Use OpenAI to extract structured data
    const parsedData = await parseResumeWithAI(textContent);

    // Calculate AI Match Score
    const matchResult = await calculateMatchScore(parsedData.skills, job.requirements);
    const matchScore = matchResult.score;

    // Create User (Candidate) if not exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: "CANDIDATE",
        }
      });
    }

    // Create Candidate Profile if not exists
    let candidate = await prisma.candidate.findUnique({ where: { userId: user.id } });
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          userId: user.id,
          skills: parsedData.skills.join(", "),
        }
      });
    }

    // Create Resume Record
    const resume = await prisma.resume.create({
      data: {
        candidateId: candidate.id,
        fileName: resumeFile.name,
        fileUrl: "/uploads/dummy.pdf", // Mock URL until S3 is integrated
        parsedData: JSON.stringify(parsedData),
      }
    });

    // Create Application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        resumeId: resume.id,
        status: "REVIEWING",
        matchScore,
      }
    });

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
