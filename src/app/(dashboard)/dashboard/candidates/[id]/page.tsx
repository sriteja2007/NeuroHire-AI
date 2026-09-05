import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, FileText, Calendar } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
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

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      resumes: true,
      applications: {
        include: {
          job: true,
          interviews: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!candidate) {
    return notFound();
  }

  // Ensure recruiter can only view candidate if they applied to one of their jobs, or if the system allows all
  // For ATS context, we usually check if they have applications in the company
  const hasAppliedToCompany = candidate.applications.some(app => app.job.companyId === user.companyId);
  if (!hasAppliedToCompany) {
    // Optionally return notFound() or Unauthorized if strict privacy is required
  }

  const companyApplications = candidate.applications.filter(app => app.job.companyId === user.companyId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/candidates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidate Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Core Profile */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={candidate.user.image || ""} />
                <AvatarFallback className="text-2xl">{candidate.user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{candidate.user.name}</h2>
                <p className="text-muted-foreground font-medium">{candidate.headline || "No headline provided"}</p>
              </div>
              <div className="w-full flex flex-col gap-2 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> {candidate.user.email}
                </div>
                {/* Phone and Location can be added to User or Candidate model later */}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills ? (
                  candidate.skills.split(',').map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill.trim()}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.resumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resumes uploaded</p>
              ) : (
                candidate.resumes.map(resume => (
                  <div key={resume.id} className="flex items-center justify-between border p-3 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-sm font-medium truncate">{resume.fileName}</span>
                    </div>
                    <Link href={resume.fileUrl} target="_blank">
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Applications and Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {candidate.bio || "No bio provided by the candidate."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application History</CardTitle>
              <CardDescription>Roles this candidate has applied to at your company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications found.</p>
              ) : (
                companyApplications.map(app => (
                  <div key={app.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{app.job.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Briefcase className="h-4 w-4" /> {app.job.location || "Remote"}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" /> Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge>{app.status}</Badge>
                        {app.matchScore && (
                          <Badge variant="outline" className={app.matchScore >= 80 ? "bg-green-50 text-green-700 border-green-200" : ""}>
                            {app.matchScore}% Match
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                      <Link href={`/dashboard/applications/${app.id}`}>
                        <Button size="sm">View Application</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
