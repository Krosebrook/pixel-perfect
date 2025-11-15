import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

export async function createTestUser(email: string, environmentMode: 'sandbox' | 'production' = 'sandbox') {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  if (authError) throw authError;

  await supabase
    .from('profiles')
    .update({ environment_mode: environmentMode })
    .eq('id', authData.user.id);

  return authData.user.id;
}

export async function getTestUserToken(email: string): Promise<string> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'TestPassword123!',
  });

  if (error) throw error;
  return data.session.access_token;
}

export async function cleanupTestUser(userId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabase.auth.admin.deleteUser(userId);
}

export async function createTestUserWithBudget(
  email: string, 
  environmentMode: 'sandbox' | 'production', 
  monthlyBudget: number
) {
  const userId = await createTestUser(email, environmentMode);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  await supabase
    .from('user_budgets')
    .insert({
      user_id: userId,
      environment_mode: environmentMode,
      monthly_budget: monthlyBudget,
      current_spending: 0,
    });

  return userId;
}
