import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FlaskConical, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Variation {
  id: string;
  name: string;
  prompt: string;
}

interface ABTestDialogProps {
  onRunTest: (variations: Variation[]) => void;
  isRunning: boolean;
}

export function ABTestDialog({ onRunTest, isRunning }: ABTestDialogProps) {
  const [open, setOpen] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([
    { id: "1", name: "Variation A", prompt: "" },
    { id: "2", name: "Variation B", prompt: "" }
  ]);

  const addVariation = () => {
    if (variations.length >= 5) {
      toast.error("Maximum 5 variations allowed");
      return;
    }
    setVariations([
      ...variations,
      { id: Date.now().toString(), name: `Variation ${String.fromCharCode(65 + variations.length)}`, prompt: "" }
    ]);
  };

  const removeVariation = (id: string) => {
    if (variations.length <= 2) {
      toast.error("At least 2 variations required");
      return;
    }
    setVariations(variations.filter(v => v.id !== id));
  };

  const updateVariation = (id: string, field: 'name' | 'prompt', value: string) => {
    setVariations(variations.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleRunTest = () => {
    const emptyVariations = variations.filter(v => !v.prompt.trim());
    if (emptyVariations.length > 0) {
      toast.error("All variations must have a prompt");
      return;
    }
    onRunTest(variations);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="h-4 w-4 mr-2" />
          A/B Test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create A/B Test</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {variations.map((variation, index) => (
            <div key={variation.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`name-${variation.id}`}>Variation {String.fromCharCode(65 + index)}</Label>
                {variations.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariation(variation.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input
                id={`name-${variation.id}`}
                placeholder="Variation name"
                value={variation.name}
                onChange={(e) => updateVariation(variation.id, 'name', e.target.value)}
              />
              <Textarea
                placeholder="Enter prompt for this variation..."
                value={variation.prompt}
                onChange={(e) => updateVariation(variation.id, 'prompt', e.target.value)}
                rows={4}
              />
            </div>
          ))}
          <Button variant="outline" onClick={addVariation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Variation
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleRunTest} disabled={isRunning} className="flex-1">
              Run A/B Test
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
