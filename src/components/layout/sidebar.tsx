"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Building2,
  FileText
} from "lucide-react";
import { signOut } from "next-auth/react";

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    title: "Candidates",
    href: "/dashboard/candidates",
    icon: Users,
  },
  {
    title: "Resumes",
    href: "/dashboard/resumes",
    icon: FileText,
  },
  {
    title: "Company",
    href: "/dashboard/company",
    icon: Building2,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-64 h-full border-r bg-card/50 backdrop-blur-xl px-4 py-6">
      <div className="mb-8 px-4 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">N</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
          NeuroHire
        </h2>
      </div>
      
      <div className="space-y-1 flex-1">
        {sidebarNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
              pathname === item.href
                ? "bg-primary/10 text-primary hover:bg-primary/15"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )} />
            {item.title}
          </Link>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border/50">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
