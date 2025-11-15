import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

Deno.test("RLS: Users can only access their own prompts", async () => {
  const email1 = `user1-${Date.now()}@example.com`;
  const email2 = `user2-${Date.now()}@example.com`;
  
  const userId1 = await createTestUser(email1, 'production');
  const userId2 = await createTestUser(email2, 'production');

  try {
    const token1 = await getTestUserToken(email1);
    const token2 = await getTestUserToken(email2);
    
    const supabase1 = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token1}` } } }
    );
    
    const supabase2 = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token2}` } } }
    );

    // User 1 creates a private prompt
    const { data: prompt } = await supabase1
      .from('prompts')
      .insert({
        name: 'Private Test Prompt',
        problem: 'Test problem',
        format: 'text',
        goal_type: 'completion',
        precision: 'A1',
        model_target: 'gpt',
        generated_prompt: 'Test prompt content',
        created_by: userId1,
        visibility: 'private'
      })
      .select()
      .single();

    // User 2 tries to access it
    const { data: accessed, error } = await supabase2
      .from('prompts')
      .select('*')
      .eq('id', prompt.id)
      .single();

    assertEquals(accessed, null, "User 2 should not access User 1's private prompt");
    assertExists(error, "Should return an error");

  } finally {
    await cleanupTestUser(userId1);
    await cleanupTestUser(userId2);
  }
});

Deno.test("RLS: Users can access their own data", async () => {
  const email = `user-own-data-${Date.now()}@example.com`;
  const userId = await createTestUser(email, 'production');

  try {
    const token = await getTestUserToken(email);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Create a prompt
    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert({
        name: 'My Test Prompt',
        problem: 'Test problem',
        format: 'text',
        goal_type: 'completion',
        precision: 'A1',
        model_target: 'gpt',
        generated_prompt: 'Test prompt content',
        created_by: userId,
        visibility: 'private'
      })
      .select()
      .single();

    assertEquals(error, null, "Should create prompt successfully");
    assertExists(prompt, "Should return created prompt");

    // Access own prompt
    const { data: accessed } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', prompt.id)
      .single();

    assertExists(accessed, "Should access own prompt");
    assertEquals(accessed.id, prompt.id);

  } finally {
    await cleanupTestUser(userId);
  }
});
