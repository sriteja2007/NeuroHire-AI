import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Search, Mail, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
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

  // Parse searchParams
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;

  const whereClause: any = {
    job: { companyId: user.companyId }
  };

  if (search) {
    whereClause.OR = [
      { candidate: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { candidate: { user: { email: { contains: search, mode: 'insensitive' } } } },
      { candidate: { skills: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Fetch all applications for this company's jobs
  const [applications, totalCount] = await Promise.all([
    prisma.application.findMany({
      where: whereClause,
      include: {
        candidate: {
          include: { user: true }
        },
        job: true,
        resume: true,
      },
      orderBy: { matchScore: 'desc' },
      skip,
      take: limit,
    }),
    prisma.application.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage all applicants across your open positions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form className="relative w-full max-w-sm" method="GET">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            name="search" 
            defaultValue={search || ""} 
            placeholder="Search candidates by name, email, or skill..." 
            className="pl-8" 
          />
        </form>
        <div className="flex gap-2">
          <Button variant="outline"><Mail className="mr-2 h-4 w-4" /> Message Selected</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b bg-muted/50">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 w-12 px-4 text-left align-middle"><input type="checkbox" className="rounded" /></th>
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
                <td colSpan={7} className="h-24 text-center text-muted-foreground">
                  No candidates found.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle"><input type="checkbox" className="rounded" /></td>
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
                    <Link href={`/dashboard/candidates/${app.candidate.id}`}>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-2" /> View Profile
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {skip + 1} to {Math.min(skip + limit, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Link href={page <= 1 ? "#" : `/dashboard/candidates?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="text-sm font-medium px-2">Page {page} of {totalPages}</div>
              <Link href={page >= totalPages ? "#" : `/dashboard/candidates?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

