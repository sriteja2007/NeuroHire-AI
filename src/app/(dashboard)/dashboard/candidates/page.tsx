import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Search, Mail, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function CandidatesPage() {
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

  // Fetch all applications for this company's jobs
  const applications = await prisma.application.findMany({
    where: { job: { companyId: user.companyId } },
    include: {
      candidate: {
        include: { user: true }
      },
      job: true,
      resume: true,
    },
    orderBy: { matchScore: 'desc' }, // Order by AI match score by default
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage all applicants across your open positions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search candidates by name, email, or skill..." className="pl-8" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Mail className="mr-2 h-4 w-4" /> Message Selected</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b bg-muted/50">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Candidate</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Applied Role</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">AI Match</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-24 text-center text-muted-foreground">
                  No candidates have applied yet.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={app.candidate.user.image || ""} />
                        <AvatarFallback>{app.candidate.user.name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{app.candidate.user.name}</div>
                        <div className="text-xs text-muted-foreground">{app.candidate.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium text-primary">
                    <Link href={`/dashboard/jobs/${app.job.id}`} className="hover:underline">
                      {app.job.title}
                    </Link>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${app.matchScore && app.matchScore > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                          style={{ width: `${app.matchScore || 0}%` }}
                        />
                      </div>
                      <span className="font-bold">{app.matchScore || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant={app.status === 'HIRED' ? 'default' : app.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">{new Date(app.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 align-middle text-right">
                    <Button variant="ghost" size="sm" onClick={() => window.location.href=`/dashboard/candidates/${app.id}`}>
                      <FileText className="h-4 w-4 mr-2" /> View Profile
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
