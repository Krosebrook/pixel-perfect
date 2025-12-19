/**
 * Prompt Service
 * Handles all prompt-related data operations
 */

import { BaseService, type ServiceResult } from './base.service';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { QUERY_KEYS } from '@/lib/constants';

type Prompt = Tables<'prompts'>;
type PromptInsert = TablesInsert<'prompts'>;
type PromptUpdate = TablesUpdate<'prompts'>;
type PromptVersion = Tables<'prompt_versions'>;

export interface PromptWithVersions extends Prompt {
  versions?: PromptVersion[];
}

export interface PromptFilters {
  visibility?: 'public' | 'private';
  categoryId?: string;
  teamId?: string;
  search?: string;
  tags?: string[];
}

class PromptService extends BaseService {
  /**
   * Fetches all prompts for a user with optional filters
   */
  async getPrompts(
    userId: string,
    filters?: PromptFilters
  ): Promise<ServiceResult<Prompt[]>> {
    return this.execute(async () => {
      let query = this.supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.teamId) {
        query = query.eq('team_id', filters.teamId);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,problem.ilike.%${filters.search}%`
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ?? [];
    });
  }

  /**
   * Fetches a single prompt by ID with its versions
   */
  async getPromptById(promptId: string): Promise<ServiceResult<PromptWithVersions>> {
    return this.execute(async () => {
      const { data: prompt, error: promptError } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (promptError) throw promptError;

      const { data: versions, error: versionsError } = await this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;

      return { ...prompt, versions: versions ?? [] };
    });
  }

  /**
   * Creates a new prompt
   */
  async createPrompt(prompt: PromptInsert): Promise<ServiceResult<Prompt>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .from('prompts')
        .insert(prompt)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Updates an existing prompt
   */
  async updatePrompt(
    promptId: string,
    updates: PromptUpdate
  ): Promise<ServiceResult<Prompt>> {
    return this.execute(async () => {
      const { data, error } = await this.supabase
        .from('prompts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', promptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Deletes a prompt
   */
  async deletePrompt(promptId: string): Promise<ServiceResult<void>> {
    return this.execute(async () => {
      const { error } = await this.supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;
    });
  }

  /**
   * Creates a new version of a prompt
   */
  async createVersion(
    promptId: string,
    userId: string,
    spec: Record<string, unknown>,
    generatedPrompt: string,
    qualityScores?: Record<string, number>
  ): Promise<ServiceResult<PromptVersion>> {
    return this.execute(async () => {
      // Get the latest version number
      const { data: latestVersion } = await this.supabase
        .from('prompt_versions')
        .select('version_number')
        .eq('prompt_id', promptId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

      const insertData = {
        prompt_id: promptId,
        created_by: userId,
        version_number: nextVersionNumber,
        spec,
        generated_prompt: generatedPrompt,
        quality_scores: qualityScores ?? null,
      } as const;

      const { data, error } = await this.supabase
        .from('prompt_versions')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(
    promptId: string,
    versionId: string
  ): Promise<ServiceResult<Prompt>> {
    return this.execute(async () => {
      // Get the version to rollback to
      const { data: version, error: versionError } = await this.supabase
        .from('prompt_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update the prompt with the version's data
      const spec = version.spec as Record<string, unknown>;
      const { data, error } = await this.supabase
        .from('prompts')
        .update({
          generated_prompt: version.generated_prompt,
          quality_scores: version.quality_scores,
          goal_type: spec.goal_type as string,
          problem: spec.problem as string,
          precision: spec.precision as string,
          model_target: spec.model_target as string,
          format: spec.format as string,
          constraints: spec.constraints as string | null,
          success_criteria: spec.success_criteria as string | null,
          voice_style: spec.voice_style as string | null,
          tech_env: spec.tech_env as string | null,
          depth: spec.depth as string | null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  /**
   * Forks a prompt
   */
  async forkPrompt(
    originalPromptId: string,
    userId: string,
    newName?: string
  ): Promise<ServiceResult<Prompt>> {
    return this.execute(async () => {
      // Get the original prompt
      const { data: original, error: fetchError } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', originalPromptId)
        .single();

      if (fetchError) throw fetchError;

      // Create the forked prompt
      const { data, error } = await this.supabase
        .from('prompts')
        .insert({
          name: newName ?? `${original.name} (Fork)`,
          goal_type: original.goal_type,
          problem: original.problem,
          precision: original.precision,
          model_target: original.model_target,
          format: original.format,
          constraints: original.constraints,
          success_criteria: original.success_criteria,
          voice_style: original.voice_style,
          tech_env: original.tech_env,
          depth: original.depth,
          generated_prompt: original.generated_prompt,
          description: original.description,
          tags: original.tags,
          created_by: userId,
          fork_of: originalPromptId,
          visibility: 'private',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }
}

// Export singleton instance
export const promptService = new PromptService();
