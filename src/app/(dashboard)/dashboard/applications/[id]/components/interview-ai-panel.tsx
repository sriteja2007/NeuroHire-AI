"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BrainCircuit, FileText } from "lucide-react";
import { createAiInterviewQuestions, createAiInterviewFeedback } from "@/app/actions/interview-ai";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function InterviewAiPanel({ applicationId, interviews }: { applicationId: string, interviews: any[] }) {
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  async function handleGenerateQuestions() {
    setLoadingQuestions(true);
    try {
      const res = await createAiInterviewQuestions(applicationId, "Medium");
      if (res.success) toast.success("Interview questions generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleGenerateFeedback(interviewId: string) {
    const text = transcripts[interviewId];
    if (!text?.trim()) return toast.error("Please enter interview notes/transcript first.");
    
    setLoadingFeedback(interviewId);
    try {
      const res = await createAiInterviewFeedback(interviewId, text);
      if (res.success) toast.success("AI Feedback generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate feedback");
    } finally {
      setLoadingFeedback(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          AI Interviews
        </h2>
        <Button onClick={handleGenerateQuestions} disabled={loadingQuestions} size="sm">
          {loadingQuestions ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Generate New Interview
        </Button>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
          <p>No AI interviews generated yet.</p>
        </div>
      ) : (
        interviews.map(interview => (
          <Card key={interview.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold">
                  Scheduled for {new Date(interview.scheduledAt).toLocaleDateString()}
                </CardTitle>
                <Badge variant={interview.status === "COMPLETED" ? "default" : "secondary"}>
                  {interview.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              
              {/* Questions */}
              {interview.aiQuestions && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> AI Generated Questions
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(interview.aiQuestions).map(([category, questions]: [string, any]) => (
                      <div key={category}>
                        <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1">{category}</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1">
                          {questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Input or Result */}
              {interview.status !== "COMPLETED" ? (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-2">Interview Notes / Transcript</h3>
                  <textarea
                    className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                    placeholder="Paste the transcript or your notes here..."
                    value={transcripts[interview.id] || ""}
                    onChange={e => setTranscripts({...transcripts, [interview.id]: e.target.value})}
                  />
                  <Button 
                    className="mt-2 w-full" 
                    onClick={() => handleGenerateFeedback(interview.id)}
                    disabled={loadingFeedback === interview.id}
                  >
                    {loadingFeedback === interview.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Generate AI Feedback
                  </Button>
                </div>
              ) : interview.aiFeedback ? (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="text-sm font-semibold mb-2 text-primary">AI Feedback & Evaluation</h3>
                  <div className="grid grid-cols-4 gap-2 text-center mb-4">
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xl font-bold">{interview.aiFeedback.technicalScore}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Technical</p>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xl font-bold">{interview.aiFeedback.communicationScore}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Comm</p>
                    </div>
                    <div className="bg-muted p-2 rounded-lg">
                      <p className="text-xl font-bold">{interview.aiFeedback.problemSolvingScore}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">Problem Solv.</p>
                    </div>
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <p className="text-xl font-bold">{interview.aiFeedback.recommendation}</p>
                      <p className="text-[10px] uppercase">Decision</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{interview.aiFeedback.overallPerformance}</p>
                  <div>
                    <h4 className="text-xs font-bold text-green-600">Strengths</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {interview.aiFeedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-red-500">Weaknesses</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {interview.aiFeedback.weaknesses?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Suggested Next Steps</h4>
                    <p className="text-sm text-muted-foreground">{interview.aiFeedback.suggestedNextSteps}</p>
                  </div>
                </div>
              ) : null}

            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
