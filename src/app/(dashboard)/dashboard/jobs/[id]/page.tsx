import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { KanbanBoard } from "./components/kanban-board";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    return <div>Unauthorized.</div>;
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      applications: {
        include: {
          candidate: {
            include: { user: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      }
    }
  });

  if (!job || job.companyId !== user.companyId) {
    return notFound();
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <Badge variant={job.isActive ? "default" : "secondary"}>
                {job.isActive ? "Active" : "Closed"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {job.location ? `${job.location} • ` : ""}
              {job.applications.length} Applicants
            </p>
          </div>
        </div>
        <Link href={`/dashboard/jobs/${job.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" /> Edit Job
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {/* We pass the plain application objects. We need to serialize them safely */}
        <KanbanBoard 
          jobId={job.id} 
          applications={job.applications.map(app => ({
            id: app.id,
            status: app.status,
            matchScore: app.matchScore,
            candidateName: app.candidate.user.name || "Unknown Candidate",
            candidateHeadline: app.candidate.headline || "",
            candidateId: app.candidate.id
          }))} 
        />
      </div>
    </div>
  );
}
