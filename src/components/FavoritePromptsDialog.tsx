import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface FavoritePromptsDialogProps {
  onSelectPrompt: (prompt: string, models: string[]) => void;
  currentPrompt?: string;
  currentModels?: string[];
}

export function FavoritePromptsDialog({ 
  onSelectPrompt, 
  currentPrompt, 
  currentModels 
}: FavoritePromptsDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: favorites } = useQuery({
    queryKey: ['favorite-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_prompts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('favorite_prompts')
        .insert({
          user_id: user!.id,
          name,
          prompt_text: currentPrompt || '',
          description,
          models: currentModels || [],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-prompts'] });
      toast.success('Prompt saved to favorites');
      setSaveDialogOpen(false);
      setName('');
      setDescription('');
    },
    onError: () => {
      toast.error('Failed to save prompt');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('favorite_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-prompts'] });
      toast.success('Favorite deleted');
    },
    onError: () => {
      toast.error('Failed to delete favorite');
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Favorite Prompts</DialogTitle>
            <DialogDescription>
              Save and reuse your frequently used test prompts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => setSaveDialogOpen(true)}
              disabled={!currentPrompt}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Current Prompt
            </Button>

            {favorites?.map((favorite) => (
              <Card key={favorite.id} className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardHeader
                  onClick={() => {
                    onSelectPrompt(favorite.prompt_text, favorite.models);
                    setOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base">{favorite.name}</CardTitle>
                      {favorite.description && (
                        <CardDescription className="mt-1">
                          {favorite.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(favorite.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {favorite.prompt_text}
                  </p>
                  {favorite.models.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Models: {favorite.models.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {favorites?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No favorite prompts yet. Save your first one!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Prompt to Favorites</DialogTitle>
            <DialogDescription>
              Give your prompt a name and optional description
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Code Review Test"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save to Favorites'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
