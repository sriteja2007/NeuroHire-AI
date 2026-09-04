"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b bg-background/50 backdrop-blur-xl">
      <div className="flex items-center w-full max-w-md gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search candidates, jobs..." 
          className="border-none bg-transparent shadow-none focus-visible:ring-0 px-2"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium">{session?.user?.name || "Guest"}</span>
            <span className="text-xs text-muted-foreground">{session?.user?.role || "User"}</span>
          </div>
          <Avatar>
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {session?.user?.name?.[0]?.toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
