import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Sparkles, TrendingUp, Code, FileText, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ['prompt-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['prompt-templates', searchQuery, selectedCategory, selectedDifficulty],
    queryFn: async () => {
      let query = supabase
        .from('prompt_templates')
        .select('*, prompt_categories(name, icon)')
        .order('use_count', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty_level', selectedDifficulty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    const variables = template.variables || [];
    const initialValues: Record<string, any> = {};
    variables.forEach((v: any) => {
      initialValues[v.name] = v.default || '';
    });
    setVariableValues(initialValues);
  };

  const handleApplyTemplate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('apply-template', {
        body: {
          templateId: selectedTemplate.id,
          variables: variableValues
        }
      });

      if (error) throw error;

      toast({
        title: "Template Applied",
        description: "Your prompt has been generated. Redirecting to comparison...",
      });

      setSelectedTemplate(null);
      navigate('/', { state: { generatedPrompt: data.filledPrompt } });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Prompt Templates
          </h1>
          <p className="text-muted-foreground">
            Start with pre-built templates and customize them for your needs
          </p>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.is_system && <Sparkles className="h-4 w-4 text-primary" />}
                      {template.name}
                    </CardTitle>
                    <Badge className={getDifficultyColor(template.difficulty_level)}>
                      {template.difficulty_level}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags?.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      {template.use_count} uses
                    </div>
                    <Button onClick={() => handleUseTemplate(template)}>
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {templates?.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        )}
      </main>

      {/* Template Variables Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Fill in the variables to generate your custom prompt
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedTemplate?.variables?.map((variable: any) => (
              <div key={variable.name} className="space-y-2">
                <Label htmlFor={variable.name}>
                  {variable.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Label>
                <p className="text-sm text-muted-foreground">{variable.description}</p>
                
                {variable.type === 'textarea' ? (
                  <Textarea
                    id={variable.name}
                    value={variableValues[variable.name] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable.name]: e.target.value
                    })}
                    placeholder={variable.default || ''}
                    rows={4}
                  />
                ) : variable.type === 'select' ? (
                  <Select
                    value={variableValues[variable.name] || variable.default}
                    onValueChange={(value) => setVariableValues({
                      ...variableValues,
                      [variable.name]: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variable.options?.map((option: string) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={variable.name}
                    type={variable.type || 'text'}
                    value={variableValues[variable.name] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable.name]: e.target.value
                    })}
                    placeholder={variable.default || ''}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate}>
              Generate Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}