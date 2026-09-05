import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardChart } from "./components/dashboard-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getDashboardAiInsights } from "@/app/actions/dashboard-ai";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true }
  });

  if (!user || user.role !== "RECRUITER" || !user.companyId) {
    return <div>Welcome to NeuroHire! Please wait for approval.</div>;
  }

  const companyId = user.companyId;

  const [
    totalJobs,
    activeJobs,
    totalCandidates,
    applications,
    interviews,
    avgScoreResult,
    recentApplications,
    aiInsights
  ] = await Promise.all([
    prisma.job.count({ where: { companyId: companyId } }),
    prisma.job.count({ where: { companyId: companyId, isActive: true } }),
    prisma.candidate.count({ where: { applications: { some: { job: { companyId: companyId } } } } }),
    prisma.application.count({ where: { job: { companyId: companyId } } }),
    prisma.interview.count({ where: { application: { job: { companyId: companyId } }, status: "SCHEDULED" } }),
    prisma.application.aggregate({
      where: { job: { companyId: companyId }, matchScore: { not: null } },
      _avg: { matchScore: true }
    }),
    prisma.application.findMany({
      where: { job: { companyId: companyId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        candidate: { include: { user: true } },
        job: true
      }
    }),
    getDashboardAiInsights()
  ]);

  const avgMatchScore = avgScoreResult._avg.matchScore 
    ? Math.round(avgScoreResult._avg.matchScore) 
    : 0;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s a summary of your hiring pipeline.
        </p>
      </div>

      {aiInsights && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" /> AI Pipeline Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium leading-relaxed">{aiInsights}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Across all {totalJobs} jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {activeJobs > 0 ? "Currently hiring" : "No active jobs"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled interviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMatchScore}%</div>
            <p className="text-xs text-muted-foreground">
              From AI screening
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hiring Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <DashboardChart />
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              {recentApplications.length === 0 ? (
                <div className="text-center text-muted-foreground pt-10">No recent applications</div>
              ) : (
                recentApplications.map(app => (
                  <div key={app.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={app.candidate.user.image || ""} />
                      <AvatarFallback>{app.candidate.user.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1 overflow-hidden">
                      <Link href={`/dashboard/applications/${app.id}`} className="hover:underline">
                        <p className="text-sm font-medium leading-none truncate">{app.candidate.user.name}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.job.title}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <Badge variant="outline" className={app.matchScore && app.matchScore > 80 ? "text-green-600 bg-green-50 border-green-200" : ""}>
                        {app.matchScore ? `${app.matchScore}%` : "N/A"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
