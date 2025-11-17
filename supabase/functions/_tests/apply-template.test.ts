import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { createTestUser, getTestUserToken, cleanupTestUser } from './helpers/test-utils.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/apply-template`;

Deno.test('Apply Template: Successfully applies template with variables', async () => {
  const testEmail = `test-template-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  // Create a test template
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: template } = await supabase
    .from('prompt_templates')
    .insert({
      name: 'Test Template',
      description: 'A test template',
      template_content: 'Write a {{tone}} email about {{subject}}',
      variables: {
        tone: { type: 'string', required: true },
        subject: { type: 'string', required: true },
      },
      is_system: true,
    })
    .select()
    .single();

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: template.id,
        variables: {
          tone: 'professional',
          subject: 'project updates',
        },
      }),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertExists(data.filledTemplate);
    assertEquals(data.filledTemplate.includes('professional'), true);
    assertEquals(data.filledTemplate.includes('project updates'), true);
  } finally {
    await supabase.from('prompt_templates').delete().eq('id', template.id);
    await cleanupTestUser(userId);
  }
});

Deno.test('Apply Template: Validates required variables', async () => {
  const testEmail = `test-template-vars-${Date.now()}@example.com`;
  const userId = await createTestUser(testEmail, 'sandbox');
  const token = await getTestUserToken(testEmail);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: template } = await supabase
    .from('prompt_templates')
    .insert({
      name: 'Required Vars Template',
      description: 'Template with required variables',
      template_content: 'Hello {{name}}',
      variables: {
        name: { type: 'string', required: true },
      },
      is_system: true,
    })
    .select()
    .single();

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: template.id,
        variables: {}, // Missing required 'name' variable
      }),
    });

    assertEquals(response.status, 400);
  } finally {
    await supabase.from('prompt_templates').delete().eq('id', template.id);
    await cleanupTestUser(userId);
  }
});
