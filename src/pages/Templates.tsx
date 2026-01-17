import { useState, useCallback, useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { EmptyState } from '@/components/EmptyState';

interface TemplateVariable {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  tags: string[] | null;
  use_count: number;
  is_system: boolean;
  template_content: string;
  variables: TemplateVariable[] | unknown | null;
  prompt_categories: { name: string; icon: string } | null;
}

// Memoized template card
const TemplateCard = memo(function TemplateCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: (template: Template) => void;
}) {
  const difficultyColor = useMemo(() => {
    switch (template.difficulty_level) {
      case 'beginner': return 'bg-green-500/10 text-green-500';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  }, [template.difficulty_level]);

  const handleUse = useCallback(() => {
    onUse(template);
  }, [template, onUse]);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow" 
      role="article"
      aria-labelledby={`template-${template.id}-title`}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle 
            id={`template-${template.id}-title`} 
            className="text-lg flex items-center gap-2"
          >
            {template.is_system && (
              <Sparkles className="h-4 w-4 text-primary" aria-label="System template" />
            )}
            {template.name}
          </CardTitle>
          <Badge 
            className={difficultyColor}
            aria-label={`Difficulty: ${template.difficulty_level}`}
          >
            {template.difficulty_level}
          </Badge>
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Template tags">
          {template.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs" role="listitem">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span aria-label={`Used ${template.use_count} times`}>{template.use_count} uses</span>
          </div>
          <Button onClick={handleUse} aria-label={`Use template: ${template.name}`}>
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized skeleton loader
const TemplateSkeletonLoader = memo(function TemplateSkeletonLoader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading templates">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-full" />
          </CardHeader>
        </Card>
      ))}
      <span className="sr-only">Loading templates...</span>
    </div>
  );
});

// Variable input component
const VariableInput = memo(function VariableInput({
  variable,
  value,
  onChange,
}: {
  variable: TemplateVariable;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  const handleChange = useCallback((newValue: string) => {
    onChange(variable.name, newValue);
  }, [variable.name, onChange]);

  const formattedLabel = useMemo(
    () => variable.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    [variable.name]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={variable.name}>
        {formattedLabel}
      </Label>
      {variable.description && (
        <p id={`${variable.name}-description`} className="text-sm text-muted-foreground">
          {variable.description}
        </p>
      )}
      
      {variable.type === 'textarea' ? (
        <Textarea
          id={variable.name}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={variable.default || ''}
          rows={4}
          aria-describedby={variable.description ? `${variable.name}-description` : undefined}
        />
      ) : variable.type === 'select' && variable.options ? (
        <Select
          value={value || variable.default}
          onValueChange={handleChange}
        >
          <SelectTrigger aria-describedby={variable.description ? `${variable.name}-description` : undefined}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variable.options.map((option: string) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={variable.name}
          type={variable.type || 'text'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={variable.default || ''}
          aria-describedby={variable.description ? `${variable.name}-description` : undefined}
        />
      )}
    </div>
  );
});

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // Debounce search query for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

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
    queryKey: ['prompt-templates', debouncedSearch, selectedCategory, selectedDifficulty],
    queryFn: async () => {
      let query = supabase
        .from('prompt_templates')
        .select('*, prompt_categories(name, icon)')
        .order('use_count', { ascending: false });

      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,tags.cs.{${debouncedSearch}}`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedDifficulty !== 'all') {
        query = query.eq('difficulty_level', selectedDifficulty);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    }
  });

  const handleUseTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    const variables = (template.variables as TemplateVariable[] | null) || [];
    const initialValues: Record<string, string> = {};
    variables.forEach((v) => {
      initialValues[v.name] = v.default || '';
    });
    setVariableValues(initialValues);
  }, []);

  const handleVariableChange = useCallback((name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const handleApplyTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

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
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to apply template',
        variant: "destructive"
      });
    }
  }, [selectedTemplate, variableValues, toast, navigate]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const memoizedTemplateList = useMemo(() => {
    if (!templates) return null;
    return templates.map((template) => (
      <TemplateCard
        key={template.id}
        template={template}
        onUse={handleUseTemplate}
      />
    ));
  }, [templates, handleUseTemplate]);

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8" role="main" aria-label="Prompt templates">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
            Prompt Templates
          </h1>
          <p className="text-muted-foreground">
            Start with pre-built templates and customize them for your needs
          </p>
        </header>

        {/* Filters */}
        <section className="grid gap-4 md:grid-cols-3 mb-6" aria-label="Template filters">
          <div className="relative">
            <Search 
              className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" 
              aria-hidden="true" 
            />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
              aria-label="Search templates"
            />
          </div>
          
          <Select 
            value={selectedCategory} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger aria-label="Filter by category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedDifficulty} 
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger aria-label="Filter by difficulty level">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Templates Grid */}
        {isLoading ? (
          <TemplateSkeletonLoader />
        ) : (
          <section 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
            aria-label="Template list"
            role="feed"
          >
            {memoizedTemplateList}
          </section>
        )}

        {templates?.length === 0 && (
          <EmptyState 
            variant="templates"
            title="No templates found"
            description="Try adjusting your search or filters, or check back later for new templates."
          />
        )}
      </main>

      {/* Template Variables Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={handleCloseDialog}>
        <DialogContent 
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          aria-labelledby="template-dialog-title"
          aria-describedby="template-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="template-dialog-title">
              Configure Template: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription id="template-dialog-description">
              Fill in the variables to generate your custom prompt
            </DialogDescription>
          </DialogHeader>

          <form 
            className="space-y-4 py-4" 
            onSubmit={(e) => { e.preventDefault(); handleApplyTemplate(); }}
          >
            {((selectedTemplate?.variables as TemplateVariable[] | null) || []).map((variable) => (
              <VariableInput
                key={variable.name}
                variable={variable}
                value={variableValues[variable.name] || ''}
                onChange={handleVariableChange}
              />
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                Generate Prompt
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
