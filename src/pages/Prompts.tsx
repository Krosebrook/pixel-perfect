import { useState, useCallback, useMemo, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Star, TrendingUp, Clock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePrompts, useUpdatePrompt } from '@/hooks/usePrompts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/EmptyState';
import { useDebouncedCallback } from '@/hooks/useDebounce';

// ============================================================================
// Types
// ============================================================================

interface PromptCardProps {
  prompt: {
    id: string;
    problem: string;
    description: string | null;
    visibility: string | null;
    created_at: string | null;
    created_by: string;
    use_count: number | null;
    is_featured: boolean | null;
    prompt_categories?: { name: string; icon: string | null } | null;
    profiles?: { display_name: string | null } | null;
  };
  isOwner: boolean;
  onToggleVisibility: (promptId: string, currentVisibility: string | null) => void;
}

interface CategorySidebarProps {
  categories: { id: string; name: string; icon: string | null }[] | undefined;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

// ============================================================================
// Memoized Sub-Components
// ============================================================================

const PromptCard = memo(function PromptCard({ prompt, isOwner, onToggleVisibility }: PromptCardProps) {
  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility(prompt.id, prompt.visibility);
  }, [prompt.id, prompt.visibility, onToggleVisibility]);

  return (
    <Card 
      className="hover:border-primary/50 transition-colors"
      role="article"
      aria-labelledby={`prompt-title-${prompt.id}`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap" role="list" aria-label="Prompt badges">
              {prompt.prompt_categories && (
                <Badge variant="outline" role="listitem">
                  <span className="mr-1" aria-hidden="true">{prompt.prompt_categories.icon}</span>
                  {prompt.prompt_categories.name}
                </Badge>
              )}
              {prompt.visibility === 'public' ? (
                <Badge variant="secondary" role="listitem">
                  <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                  <span>Public</span>
                </Badge>
              ) : (
                <Badge variant="outline" role="listitem">
                  <EyeOff className="h-3 w-3 mr-1" aria-hidden="true" />
                  <span>Private</span>
                </Badge>
              )}
            </div>
            <Link 
              to={`/prompts/${prompt.id}`}
              aria-describedby={prompt.description ? `prompt-desc-${prompt.id}` : undefined}
            >
              <CardTitle 
                id={`prompt-title-${prompt.id}`}
                className="hover:text-primary transition-colors line-clamp-2"
              >
                {prompt.problem}
              </CardTitle>
            </Link>
            {prompt.description && (
              <CardDescription 
                id={`prompt-desc-${prompt.id}`}
                className="mt-2 line-clamp-2"
              >
                {prompt.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap" aria-label="Prompt metadata">
            <span>{prompt.profiles?.display_name || 'Anonymous'}</span>
            <span className="flex items-center gap-1" aria-label={`${prompt.use_count || 0} uses`}>
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {prompt.use_count || 0} uses
            </span>
            <span 
              className="flex items-center gap-1" 
              aria-label={`Created on ${prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'Unknown'}`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              {prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          {isOwner && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleVisibility}
              aria-label={prompt.visibility === 'private' ? 'Make prompt public' : 'Make prompt private'}
            >
              {prompt.visibility === 'private' ? 'Make Public' : 'Make Private'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const CompactPromptCard = memo(function CompactPromptCard({ 
  prompt 
}: { 
  prompt: { id: string; problem: string } 
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <Link to={`/prompts/${prompt.id}`}>
          <CardTitle className="hover:text-primary transition-colors">
            {prompt.problem}
          </CardTitle>
        </Link>
      </CardHeader>
    </Card>
  );
});

const CategorySidebar = memo(function CategorySidebar({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategorySidebarProps) {
  const handleSelectAll = useCallback(() => {
    onSelectCategory(null);
  }, [onSelectCategory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm" id="categories-title">Categories</CardTitle>
      </CardHeader>
      <CardContent 
        className="space-y-1" 
        role="listbox" 
        aria-labelledby="categories-title"
        aria-activedescendant={selectedCategory ? `category-${selectedCategory}` : 'category-all'}
      >
        <Button
          id="category-all"
          variant={selectedCategory === null ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={handleSelectAll}
          role="option"
          aria-selected={selectedCategory === null}
        >
          All Categories
        </Button>
        {categories?.map((category) => (
          <Button
            key={category.id}
            id={`category-${category.id}`}
            variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectCategory(category.id)}
            role="option"
            aria-selected={selectedCategory === category.id}
          >
            <span className="mr-2" aria-hidden="true">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});

const SearchInput = memo(function SearchInput({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="relative flex-1">
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
        aria-hidden="true"
      />
      <Input
        placeholder="Search prompts..."
        value={value}
        onChange={handleChange}
        className="pl-9"
        aria-label="Search prompts"
        type="search"
      />
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

function Prompts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounce search input
  const debouncedSetSearch = useDebouncedCallback(
    (value: string) => setDebouncedSearch(value),
    300
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleSelectCategory = useCallback((id: string | null) => {
    setSelectedCategory(id);
  }, []);

  const handleCreateNew = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Use the service layer hook for prompts
  const { data: prompts, isLoading, refetch } = usePrompts(user?.id || '', {
    categoryId: selectedCategory || undefined,
    search: debouncedSearch || undefined,
  });

  const updatePrompt = useUpdatePrompt();

  const toggleVisibility = useCallback(async (promptId: string, currentVisibility: string | null) => {
    const newVisibility = currentVisibility === 'private' ? 'public' : 'private';
    
    try {
      await updatePrompt.mutateAsync({
        promptId,
        updates: { visibility: newVisibility },
      });
      toast.success(`Prompt is now ${newVisibility}`);
      refetch();
    } catch {
      toast.error('Failed to update visibility');
    }
  }, [updatePrompt, refetch]);

  // Memoized filtered lists
  const myPrompts = useMemo(
    () => prompts?.filter(p => p.created_by === user?.id) || [],
    [prompts, user?.id]
  );

  const featuredPrompts = useMemo(
    () => prompts?.filter(p => p.is_featured) || [],
    [prompts]
  );

  const allPrompts = useMemo(() => prompts || [], [prompts]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4 flex items-center justify-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading prompts...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto py-8 px-4" role="main" aria-label="Prompt Library">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prompt Library</h1>
            <p className="text-muted-foreground">
              Browse, search, and manage your prompt collection
            </p>
          </div>
          <Button onClick={handleCreateNew} aria-label="Create new prompt">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create New
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside aria-label="Prompt filters">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <SearchInput value={searchQuery} onChange={handleSearchChange} />
            </div>

            <Tabs defaultValue="all">
              <TabsList aria-label="Prompt filters">
                <TabsTrigger value="all">All Prompts</TabsTrigger>
                <TabsTrigger value="my">My Prompts</TabsTrigger>
                <TabsTrigger value="featured">
                  <Star className="h-4 w-4 mr-2" aria-hidden="true" />
                  Featured
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6" role="tabpanel" aria-label="All prompts">
                {allPrompts.length === 0 ? (
                  <EmptyState variant="prompts" onAction={handleCreateNew} />
                ) : (
                  allPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt as any}
                      isOwner={prompt.created_by === user?.id}
                      onToggleVisibility={toggleVisibility}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="my" className="space-y-4 mt-6" role="tabpanel" aria-label="My prompts">
                {myPrompts.length === 0 ? (
                  <EmptyState 
                    variant="prompts" 
                    title="No prompts created yet"
                    description="You haven't created any prompts. Start by creating your first one!"
                    onAction={handleCreateNew}
                  />
                ) : (
                  myPrompts.map((prompt) => (
                    <CompactPromptCard key={prompt.id} prompt={prompt} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4 mt-6" role="tabpanel" aria-label="Featured prompts">
                {featuredPrompts.length === 0 ? (
                  <EmptyState 
                    variant="prompts" 
                    title="No featured prompts"
                    description="Featured prompts from the community will appear here. Check back soon!"
                    actionLabel="Browse All Prompts"
                    actionHref="/prompts"
                  />
                ) : (
                  featuredPrompts.map((prompt) => (
                    <Card key={prompt.id}>
                      <CardHeader>
                        <CardTitle>{prompt.problem}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

export default memo(Prompts);
