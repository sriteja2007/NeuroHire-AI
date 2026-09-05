"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { editJob } from "@/app/actions/job";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Job } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { improveJobDescription } from "@/app/actions/generator";

export function EditJobForm({ job }: { job: Job }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(job.isActive);
  const [description, setDescription] = useState(job.description);
  const [requirements, setRequirements] = useState(job.requirements);
  const [improvingAi, setImprovingAi] = useState(false);

  async function handleImproveWithAi() {
    setImprovingAi(true);
    try {
      const res = await improveJobDescription(description, requirements);
      if (res.success) {
        // The AI might return it all together, but let's just set it to description for now,
        // or split it if it has ### Requirements.
        const fullText = res.text;
        const reqSplit = fullText.split(/###\s*(Requirements|Key Responsibilities)/i);
        if (reqSplit.length > 2) {
          setDescription(reqSplit[0].trim());
          setRequirements("### " + reqSplit[1] + reqSplit[2]);
        } else {
          setDescription(fullText);
          toast.info("AI returned a combined text. Please review.");
        }
        toast.success("Job description improved!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to improve text.");
    } finally {
      setImprovingAi(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("id", job.id);
      formData.append("isActive", isActive.toString());
      
      const res = await editJob(formData);
      if (res.success) {
        toast.success("Job updated successfully!");
        router.push("/dashboard/jobs");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update job. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Job</h1>
          <p className="text-muted-foreground mt-1">
            Update the details of this job posting.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Modify the details for the job posting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Job Status</Label>
                <div className="text-sm text-muted-foreground">
                  {isActive ? "Active and accepting applications" : "Closed, no longer accepting applications"}
                </div>
              </div>
              <Switch 
                checked={isActive} 
                onCheckedChange={setIsActive} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" defaultValue={job.title} placeholder="e.g. Senior Frontend Engineer" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={job.location || ""} placeholder="e.g. Remote, San Francisco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input id="salary" name="salary" defaultValue={job.salary || ""} placeholder="e.g. $120k - $150k" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Job Post Content</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleImproveWithAi}
                  disabled={improvingAi || !description || !requirements}
                  className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                >
                  {improvingAi ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  ✨ Improve with AI
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Job Description <span className="text-destructive">*</span></Label>
                <textarea 
                  id="description" 
                  name="description" 
                  rows={5}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the role and responsibilities..." 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements <span className="text-destructive">*</span></Label>
                <textarea 
                  id="requirements" 
                  name="requirements" 
                  rows={5}
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List the skills, experience, and requirements..." 
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
