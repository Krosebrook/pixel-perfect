import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Star, TrendingUp, Clock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Prompts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const { data: prompts, refetch } = useQuery({
    queryKey: ['prompts', selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select(`
          *,
          profiles:created_by(display_name),
          prompt_categories(name, icon)
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`problem.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleVisibility = async (promptId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'private' ? 'public' : 'private';
    const { error } = await supabase
      .from('prompts')
      .update({ visibility: newVisibility })
      .eq('id', promptId);

    if (error) {
      toast.error('Failed to update visibility');
    } else {
      toast.success(`Prompt is now ${newVisibility}`);
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Prompt Library</h1>
            <p className="text-muted-foreground">
              Browse, search, and manage your prompt collection
            </p>
          </div>
          <Button onClick={() => navigate('/')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Button
                  variant={selectedCategory === null ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Prompts</TabsTrigger>
                <TabsTrigger value="my">My Prompts</TabsTrigger>
                <TabsTrigger value="featured">
                  <Star className="h-4 w-4 mr-2" />
                  Featured
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                {prompts?.map((prompt) => (
                  <Card key={prompt.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {prompt.prompt_categories && (
                              <Badge variant="outline">
                                <span className="mr-1">{prompt.prompt_categories.icon}</span>
                                {prompt.prompt_categories.name}
                              </Badge>
                            )}
                            {prompt.visibility === 'public' ? (
                              <Badge variant="secondary">
                                <Eye className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </div>
                          <Link to={`/prompts/${prompt.id}`}>
                            <CardTitle className="hover:text-primary transition-colors line-clamp-2">
                              {prompt.problem}
                            </CardTitle>
                          </Link>
                          {prompt.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {prompt.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>{prompt.profiles?.display_name || 'Anonymous'}</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {prompt.use_count || 0} uses
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {prompt.created_by === user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleVisibility(prompt.id, prompt.visibility)}
                          >
                            {prompt.visibility === 'private' ? 'Make Public' : 'Make Private'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="my" className="space-y-4 mt-6">
                {prompts?.filter(p => p.created_by === user?.id).map((prompt) => (
                  <Card key={prompt.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <Link to={`/prompts/${prompt.id}`}>
                        <CardTitle className="hover:text-primary transition-colors">
                          {prompt.problem}
                        </CardTitle>
                      </Link>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4 mt-6">
                {prompts?.filter(p => p.is_featured).map((prompt) => (
                  <Card key={prompt.id}>
                    <CardHeader>
                      <CardTitle>{prompt.problem}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
