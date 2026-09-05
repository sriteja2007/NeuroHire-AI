"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadResume } from "@/app/actions/resume";
import { UploadCloud, Loader2 } from "lucide-react";

export function ResumeUploadForm() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await uploadResume(formData);
      if (res.success) {
        toast.success("Resume uploaded successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <Label htmlFor="file">Upload Resume (PDF/DOCX, max 5MB)</Label>
        <Input 
          id="file" 
          name="file" 
          type="file" 
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required 
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
