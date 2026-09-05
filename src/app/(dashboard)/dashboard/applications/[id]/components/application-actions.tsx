"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/app/actions/application";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ApplicationActions({ applicationId, currentStatus }: { applicationId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      try {
        await updateApplicationStatus(applicationId, newStatus);
        toast.success(`Application marked as ${newStatus}`);
      } catch (error) {
        toast.error("Failed to update application status");
      }
    });
  };

  return (
    <div className="flex gap-2">
      {currentStatus !== 'REJECTED' && (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => handleStatusChange('REJECTED')}
          disabled={isPending}
        >
          Reject
        </Button>
      )}
      
      {currentStatus !== 'INTERVIEW' && currentStatus !== 'HIRED' && currentStatus !== 'REJECTED' && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleStatusChange('INTERVIEW')}
          disabled={isPending}
        >
          Move to Interview
        </Button>
      )}

      {currentStatus !== 'HIRED' && currentStatus !== 'REJECTED' && (
        <Button 
          variant="default" 
          size="sm"
          onClick={() => handleStatusChange('HIRED')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hire Candidate"}
        </Button>
      )}
    </div>
  );
}
