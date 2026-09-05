"use client";

import { useState, useTransition } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Eye, Pencil, Copy, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";
import { deleteJob, updateJobStatus, duplicateJob } from "@/app/actions/job";
import { toast } from "sonner";

export function JobActions({ job }: { job: { id: string; isActive: boolean } }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    startTransition(async () => {
      try {
        await deleteJob(job.id);
        toast.success("Job deleted successfully");
      } catch (error) {
        toast.error("Failed to delete job");
      }
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      try {
        await duplicateJob(job.id);
        toast.success("Job duplicated successfully");
      } catch (error) {
        toast.error("Failed to duplicate job");
      }
    });
  };

  const handleStatusChange = () => {
    startTransition(async () => {
      try {
        await updateJobStatus(job.id, !job.isActive);
        toast.success(job.isActive ? "Job closed" : "Job reopened");
      } catch (error) {
        toast.error("Failed to update job status");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 p-0 items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-md border-none outline-none">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <Link href={`/dashboard/jobs/${job.id}`}>
          <DropdownMenuItem>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
        </Link>
        <Link href={`/dashboard/jobs/${job.id}/edit`}>
          <DropdownMenuItem>
            <Pencil className="mr-2 h-4 w-4" /> Edit Job
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStatusChange} disabled={isPending}>
          {job.isActive ? (
            <><Archive className="mr-2 h-4 w-4" /> Close Job</>
          ) : (
            <><RotateCcw className="mr-2 h-4 w-4" /> Reopen Job</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} disabled={isPending} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
