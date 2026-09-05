"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateApplicationStatus } from "@/app/actions/application";
import { toast } from "sonner";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type AppData = {
  id: string;
  status: string;
  matchScore: number | null;
  candidateName: string;
  candidateHeadline: string;
  candidateId: string;
};

const STAGES = [
  { id: "PENDING", label: "Open Applications" },
  { id: "REVIEWING", label: "Reviewing" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "HIRED", label: "Hired" },
  { id: "REJECTED", label: "Rejected" },
];

export function KanbanBoard({ jobId, applications: initialApps }: { jobId: string, applications: AppData[] }) {
  const [apps, setApps] = useState<AppData[]>(initialApps);
  const [isPending, startTransition] = useTransition();

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("appId", appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appId");
    
    if (!appId) return;

    const appToMove = apps.find(a => a.id === appId);
    if (!appToMove || appToMove.status === newStatus) return;

    // Optimistic update
    setApps(current => 
      current.map(a => a.id === appId ? { ...a, status: newStatus } : a)
    );

    // Server update
    startTransition(async () => {
      try {
        await updateApplicationStatus(appId, newStatus);
        toast.success(`Moved to ${newStatus}`);
      } catch (error) {
        toast.error("Failed to move application");
        // Revert optimistic update
        setApps(initialApps);
      }
    });
  };

  return (
    <div className="flex h-full gap-4 items-start pb-4">
      {STAGES.map(stage => {
        const stageApps = apps.filter(a => a.status === stage.id);
        
        return (
          <div 
            key={stage.id} 
            className="flex flex-col w-[300px] flex-shrink-0 bg-muted/30 rounded-xl border h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="p-3 font-semibold flex items-center justify-between border-b bg-muted/50 rounded-t-xl">
              <span>{stage.label}</span>
              <Badge variant="secondary">{stageApps.length}</Badge>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {stageApps.map(app => (
                <div 
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  className={`cursor-grab active:cursor-grabbing ${isPending ? 'opacity-70' : ''}`}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{app.candidateName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/dashboard/applications/${app.id}`} className="font-semibold text-sm hover:underline">
                              {app.candidateName}
                            </Link>
                            <p className="text-xs text-muted-foreground line-clamp-1">{app.candidateHeadline || "No headline"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs pt-2 border-t">
                        <Badge variant="outline" className={app.matchScore && app.matchScore > 80 ? "bg-green-50 text-green-700 border-green-200" : ""}>
                          {app.matchScore ? `${app.matchScore}% Match` : "No AI Score"}
                        </Badge>
                        <Link href={`/dashboard/candidates/${app.candidateId}`} className="text-muted-foreground hover:text-foreground underline">
                          Profile
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {stageApps.length === 0 && (
                <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
