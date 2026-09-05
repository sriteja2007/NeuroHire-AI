"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { generateApplicationInsights } from "@/app/actions/application";
import { toast } from "sonner";

export function AiAnalysisButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await generateApplicationInsights(applicationId);
      if (res.success) {
        toast.success("AI Analysis complete!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" className="mt-4 w-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all" onClick={handleAnalyze} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-primary" />}
      {loading ? "Analyzing..." : "Run AI Analysis"}
    </Button>
  );
}
