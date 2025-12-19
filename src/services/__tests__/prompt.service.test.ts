/**
 * Tests for PromptService
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { promptService } from '../prompt.service';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('PromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPrompt = {
    id: 'prompt-1',
    name: 'Test Prompt',
    problem: 'Test problem',
    goal_type: 'code',
    precision: 'high',
    model_target: 'gpt-4',
    format: 'markdown',
    generated_prompt: 'Generated prompt text',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockVersion = {
    id: 'version-1',
    prompt_id: 'prompt-1',
    version_number: 1,
    spec: { goal_type: 'code' },
    generated_prompt: 'Version 1 prompt',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('getPrompts', () => {
    it('should fetch prompts successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockPrompt],
          error: null,
        }),
      });

      (supabase.from as Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await promptService.getPrompts('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockPrompt]);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('prompts');
    });

    it('should apply visibility filter', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      const mockOrder = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as Mock).mockReturnValue({
        select: mockSelect,
      });

      await promptService.getPrompts('user-1', { visibility: 'public' });

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply search filter', async () => {
      const mockOr = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({
        or: mockOr,
      });
      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as Mock).mockReturnValue({
        select: mockSelect,
      });

      await promptService.getPrompts('user-1', { search: 'test' });

      expect(mockOr).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      (supabase.from as Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await promptService.getPrompts('user-1');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('getPromptById', () => {
    it('should fetch prompt with versions', async () => {
      let callCount = 0;
      (supabase.from as Mock).mockImplementation((table: string) => {
        callCount++;
        if (table === 'prompts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPrompt,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'prompt_versions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockVersion],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await promptService.getPromptById('prompt-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...mockPrompt,
        versions: [mockVersion],
      });
    });

    it('should handle prompt not found', async () => {
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await promptService.getPromptById('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('createPrompt', () => {
    it('should create a prompt successfully', async () => {
      (supabase.from as Mock).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPrompt,
              error: null,
            }),
          }),
        }),
      });

      const result = await promptService.createPrompt({
        name: 'Test Prompt',
        problem: 'Test problem',
        goal_type: 'code',
        precision: 'high',
        model_target: 'gpt-4',
        format: 'markdown',
        generated_prompt: 'Generated prompt text',
        created_by: 'user-1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPrompt);
    });

    it('should handle creation errors', async () => {
      (supabase.from as Mock).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      const result = await promptService.createPrompt({
        name: 'Test',
        problem: 'Problem',
        goal_type: 'code',
        precision: 'high',
        model_target: 'gpt-4',
        format: 'markdown',
        generated_prompt: 'Text',
        created_by: 'user-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('updatePrompt', () => {
    it('should update a prompt successfully', async () => {
      const updatedPrompt = { ...mockPrompt, name: 'Updated Name' };

      (supabase.from as Mock).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedPrompt,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await promptService.updatePrompt('prompt-1', {
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Name');
    });
  });

  describe('deletePrompt', () => {
    it('should delete a prompt successfully', async () => {
      (supabase.from as Mock).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await promptService.deletePrompt('prompt-1');

      expect(result.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      (supabase.from as Mock).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      const result = await promptService.deletePrompt('prompt-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('createVersion', () => {
    it('should create a new version with correct version number', async () => {
      let callCount = 0;
      (supabase.from as Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Getting latest version
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { version_number: 2 },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        } else {
          // Inserting new version
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockVersion, version_number: 3 },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await promptService.createVersion(
        'prompt-1',
        'user-1',
        { goal_type: 'code' },
        'New generated prompt'
      );

      expect(result.success).toBe(true);
      expect(result.data?.version_number).toBe(3);
    });
  });

  describe('forkPrompt', () => {
    it('should fork a prompt with new name', async () => {
      let callCount = 0;
      (supabase.from as Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetching original
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPrompt,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Creating fork
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockPrompt, id: 'forked-1', name: 'Forked Prompt' },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const result = await promptService.forkPrompt(
        'prompt-1',
        'user-2',
        'Forked Prompt'
      );

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Forked Prompt');
    });
  });
});
