import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { JobActions } from "./components/job-actions";
import { Input } from "@/components/ui/input";

export default async function JobsPage({
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

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;

  const whereClause: any = { companyId: user.companyId };
  
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [jobs, totalCount] = await Promise.all([
    prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { applications: true }
        }
      }
    }),
    prisma.job.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Manage your open positions and track candidates.
          </p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Job
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form className="relative w-full max-w-sm" method="GET">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            name="search" 
            defaultValue={search || ""} 
            placeholder="Search jobs by title or location..." 
            className="pl-8" 
          />
        </form>
      </div>

      <div className="border rounded-xl bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 w-12 px-4 text-left align-middle"><input type="checkbox" className="rounded" /></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Candidates</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Posted Date</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-24 text-center">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle"><input type="checkbox" className="rounded" /></td>
                    <td className="p-4 align-middle font-medium">
                      <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                        {job.title}
                      </Link>
                    </td>
                    <td className="p-4 align-middle">{job.location || "Remote"}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={job.isActive ? "default" : "secondary"}>
                        {job.isActive ? "Active" : "Closed"}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">{job._count.applications}</td>
                    <td className="p-4 align-middle">{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle text-right">
                      <JobActions job={{ id: job.id, isActive: job.isActive }} />
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
                <Link href={page <= 1 ? "#" : `/dashboard/jobs?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="text-sm font-medium px-2">Page {page} of {totalPages}</div>
                <Link href={page >= totalPages ? "#" : `/dashboard/jobs?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
