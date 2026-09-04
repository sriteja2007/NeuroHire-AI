import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrainCircuit, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <nav className="border-b bg-background/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">NeuroHire AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight">
            Hire the top <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">1% talent</span> with AI.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            NeuroHire automates your recruitment process. From intelligent resume parsing to AI-driven candidate interviews and rankings. Find the perfect match in seconds, not weeks.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                Start Hiring Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
            <div className="h-12 border-b bg-muted/50 flex items-center px-4 gap-2">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-yellow-400" />
              <div className="size-3 rounded-full bg-green-400" />
            </div>
            <div className="aspect-[16/9] bg-muted relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-muted-foreground p-8">
                <BrainCircuit className="h-24 w-24 text-primary/20 animate-pulse" />
                <p className="text-2xl font-medium text-center">Your Next-Gen Hiring Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 grid sm:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          {[
            {
              title: "AI Resume Parsing",
              desc: "Instantly extract skills, experience, and education from thousands of resumes with human-level accuracy.",
            },
            {
              title: "Smart Matching",
              desc: "Our neural engine compares candidate profiles directly against your job descriptions for the perfect fit.",
            },
            {
              title: "Automated Interviews",
              desc: "Let our AI assistant conduct preliminary behavioral and technical interviews round the clock.",
            },
          ].map((feature) => (
            <div key={feature.title} className="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
              <CheckCircle2 className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
