import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Format query for Postgres Full Text Search (e.g. "software engineer" -> "software | engineer")
    const formattedQuery = query.split(" ").join(" | ");

    // Concurrently search Jobs, Candidates, and Companies (if applicable)
    const [jobs, candidates] = await Promise.all([
      prisma.job.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { search: formattedQuery } },
            { description: { search: formattedQuery } },
            { requirements: { search: formattedQuery } },
          ]
        },
        take: 5,
        select: { id: true, title: true, companyId: true }
      }),
      prisma.candidate.findMany({
        where: {
          OR: [
            { user: { name: { search: formattedQuery } } },
            { skills: { search: formattedQuery } },
            { headline: { search: formattedQuery } },
          ]
        },
        take: 5,
        select: { id: true, skills: true, user: { select: { name: true, image: true } } }
      })
    ]);

    return NextResponse.json({
      results: {
        jobs,
        candidates
      }
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
