import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, FileText, Calendar, Briefcase, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { ApplicationActions } from "./components/application-actions";

export default async function ApplicationDetailsPage({ params }: { params: { id: string } }) {
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

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: true,
      candidate: {
        include: {
          user: true,
          resumes: true,
        }
      },
      resume: true,
      interviews: true,
    }
  });

  if (!application || application.job.companyId !== user.companyId) {
    return notFound();
  }

  const { candidate, job } = application;
  const activeResume = application.resume || candidate.resumes[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/jobs/${job.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
            <p className="text-muted-foreground mt-1">
              Applied for {job.title} on {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="text-sm px-3 py-1" variant={
            application.status === 'HIRED' ? 'default' :
            application.status === 'REJECTED' ? 'destructive' :
            'secondary'
          }>
            {application.status}
          </Badge>
          <ApplicationActions applicationId={application.id} currentStatus={application.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={candidate.user.image || ""} />
                <AvatarFallback className="text-2xl">{candidate.user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/dashboard/candidates/${candidate.id}`} className="hover:underline">
                  <h2 className="text-xl font-bold">{candidate.user.name}</h2>
                </Link>
                <p className="text-muted-foreground font-medium">{candidate.headline || "No headline"}</p>
              </div>
              <div className="w-full flex flex-col gap-2 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> {candidate.user.email}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Match Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl">
                {application.matchScore ? (
                  <>
                    <span className="text-5xl font-black text-primary">{application.matchScore}%</span>
                    <span className="text-sm text-muted-foreground mt-2">Recommended match</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-medium text-muted-foreground">Not evaluated</span>
                    <Button variant="outline" size="sm" className="mt-4">Run AI Analysis</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {activeResume ? (
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <span className="text-sm font-medium text-center line-clamp-2">{activeResume.fileName}</span>
                  <div className="flex gap-2 w-full mt-2">
                    <Link href={activeResume.fileUrl} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Preview</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No resume attached to this application.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-medium hover:underline">{job.title}</Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{job.location || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">{job.salary || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={job.isActive ? "default" : "secondary"}>{job.isActive ? "Active" : "Closed"}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {application.interviews.length > 0 ? (
                <div className="space-y-4">
                  {application.interviews.map(interview => (
                    <div key={interview.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg text-primary">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">Technical Interview</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(interview.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{interview.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No interviews scheduled yet</p>
                  <Button variant="outline" className="mt-4">Schedule Interview</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recruiter Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea 
                className="w-full min-h-[150px] p-3 border rounded-md bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-y text-sm"
                placeholder="Add private notes about this candidate..."
              ></textarea>
              <div className="flex justify-end mt-3">
                <Button size="sm">Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
