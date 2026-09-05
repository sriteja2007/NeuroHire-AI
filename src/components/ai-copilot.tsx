/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, X, Maximize2, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AiCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] flex flex-col shadow-2xl z-50 border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
        <div className="flex items-center gap-2 font-semibold">
          <Bot className="h-5 w-5" />
          NeuroHire Copilot
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10 space-y-2">
            <Bot className="h-10 w-10 mx-auto opacity-20" />
            <p className="text-sm font-medium">How can I help you recruit today?</p>
            <p className="text-xs">Try asking: &quot;Show my best candidate&quot; or &quot;Who matches this role?&quot;</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border shadow-sm'
              }`}>
                {m.content ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : m.toolInvocations ? (
                  <div className="italic text-xs opacity-70 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Querying database...
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input} 
            onChange={handleInputChange} 
            placeholder="Ask AI Copilot..." 
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
}
