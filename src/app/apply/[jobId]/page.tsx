import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Building2 } from "lucide-react";
import { ApplyForm } from "./apply-form";

export default async function JobApplyPage({ params }: { params: { jobId: string } }) {
  const { jobId } = await params;
  
  const job = await prisma.job.findUnique({
    where: { id: jobId, isActive: true },
    include: { company: true },
  });

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-card border flex items-center justify-center text-2xl font-bold text-primary shadow-sm">
            {job.company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {job.company.name}</span>
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {job.location}</span>}
              {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4"/> {job.salary}</span>}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About the Role</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 relative">
            <div className="sticky top-6">
              <Card className="border-primary/50 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle>Apply Now</CardTitle>
                  <CardDescription>
                    Upload your resume to apply. Our AI will automatically parse and match your skills.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApplyForm jobId={job.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
