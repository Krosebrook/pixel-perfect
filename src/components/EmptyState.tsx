/**
 * @fileoverview Reusable empty state component for pages with no data.
 * Provides consistent styling, icons, and CTAs across the app.
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, FileText, Plus, Sparkles, BarChart3, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export type EmptyStateVariant = 
  | 'prompts' 
  | 'templates' 
  | 'analytics' 
  | 'teams' 
  | 'tests' 
  | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}> = {
  prompts: {
    icon: FileText,
    title: "No prompts yet",
    description: "Create your first prompt to start generating AI-optimized content for your projects.",
    actionLabel: "Create Your First Prompt",
    actionHref: "/",
  },
  templates: {
    icon: Sparkles,
    title: "No templates available",
    description: "Templates help you quickly generate prompts. Check back soon or create your own.",
    actionLabel: "Browse Categories",
    actionHref: "/templates",
  },
  analytics: {
    icon: BarChart3,
    title: "No analytics data",
    description: "Start running prompt comparisons to see performance metrics and insights.",
    actionLabel: "Run a Comparison",
    actionHref: "/compare",
  },
  teams: {
    icon: Users,
    title: "No teams yet",
    description: "Create a team to collaborate with others on prompts and share resources.",
    actionLabel: "Create a Team",
    actionHref: "/teams",
  },
  tests: {
    icon: Zap,
    title: "No tests scheduled",
    description: "Schedule automated tests to monitor your prompt performance over time.",
    actionLabel: "Schedule a Test",
    actionHref: "/scheduled-tests",
  },
  generic: {
    icon: FileText,
    title: "No data available",
    description: "There's nothing here yet. Get started by creating something new.",
    actionLabel: "Get Started",
    actionHref: "/",
  },
};

export function EmptyState({
  variant = 'generic',
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;
  const displayActionHref = actionHref || config.actionHref;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
        
        <p className="text-muted-foreground max-w-sm mb-6">
          {displayDescription}
        </p>
        
        {children ? (
          children
        ) : onAction ? (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            {displayActionLabel}
          </Button>
        ) : (
          <Button asChild>
            <Link to={displayActionHref}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {displayActionLabel}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
