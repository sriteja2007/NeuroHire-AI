"use client";

import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { AiCopilot } from "../ai-copilot";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
      <AiCopilot />
    </div>
  );
}
