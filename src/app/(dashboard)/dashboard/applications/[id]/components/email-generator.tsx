"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { generateEmail } from "@/app/actions/generator";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function EmailGenerator({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"rejection" | "offer" | "interview">("interview");
  const [extraDetails, setExtraDetails] = useState("");
  const [emailBody, setEmailBody] = useState("");

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await generateEmail(type, applicationId, extraDetails);
      if (res.success) {
        setEmailBody(res.emailBody);
        toast.success("Email drafted!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4" /> Generate Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Email Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview Invitation</SelectItem>
                  <SelectItem value="offer">Offer Letter</SelectItem>
                  <SelectItem value="rejection">Rejection Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Extra Instructions (Optional)</Label>
              <Input 
                placeholder="e.g. Include Zoom link, offer expires in 3 days" 
                value={extraDetails}
                onChange={e => setExtraDetails(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Draft
          </Button>

          {emailBody && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Generated Draft</Label>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md text-sm"
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailBody("")}>Clear</Button>
                <Button onClick={() => {
                  toast.success("Copied to clipboard!");
                  navigator.clipboard.writeText(emailBody);
                }}>Copy Text</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
