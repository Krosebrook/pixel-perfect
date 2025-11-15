import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Share2, Copy, Check } from "lucide-react";

interface ShareDialogProps {
  testRunId: string;
}

export function ShareDialog({ testRunId }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const shareToken = crypto.randomUUID();
      const { error } = await supabase
        .from('model_test_runs')
        .update({ is_public: true, share_token: shareToken })
        .eq('id', testRunId);

      if (error) throw error;

      const url = `${window.location.origin}/share/${shareToken}`;
      setShareUrl(url);
      toast.success("Share link generated");
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Test Results</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a shareable link to this test run. Anyone with the link can view the results.
          </p>
          {!shareUrl ? (
            <Button onClick={generateShareLink} disabled={loading} className="w-full">
              Generate Share Link
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={copyToClipboard} size="icon" variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
