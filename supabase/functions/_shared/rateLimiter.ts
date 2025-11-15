import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

export interface RateLimitResult {
  allowed: boolean;
  message: string;
  remainingCalls?: number;
  resetTime?: Date;
}

export interface BudgetCheckResult {
  allowed: boolean;
  message: string;
  currentSpending?: number;
  limit?: number;
}

export async function checkRateLimit(
  userId: string,
  endpointName: string,
  environmentMode: 'sandbox' | 'production'
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get rate limit config for this environment
    const { data: limits, error: configError } = await supabase.rpc('get_rate_limit_config', {
      _environment_mode: environmentMode
    });

    if (configError) {
      console.error('Rate limit config error:', configError);
      return { allowed: true, message: 'Rate limit check unavailable' };
    }

    const endpointLimit = limits?.find((l: any) => l.endpoint_name === endpointName);
    if (!endpointLimit) {
      return { allowed: true, message: 'No rate limit configured' };
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    // Count recent calls
    const { data: recentCalls, error } = await supabase
      .from('api_rate_limits')
      .select('calls_count, window_start')
      .eq('user_id', userId)
      .eq('endpoint_name', endpointName)
      .eq('environment_mode', environmentMode)
      .gte('window_start', oneDayAgo.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, message: 'Rate limit check failed, allowing request' };
    }

    // Calculate totals for different time windows
    const callsLastMinute = recentCalls
      ?.filter(c => new Date(c.window_start) >= oneMinuteAgo)
      .reduce((sum, c) => sum + c.calls_count, 0) || 0;

    const callsLastHour = recentCalls
      ?.filter(c => new Date(c.window_start) >= oneHourAgo)
      .reduce((sum, c) => sum + c.calls_count, 0) || 0;

    const callsLastDay = recentCalls
      ?.reduce((sum, c) => sum + c.calls_count, 0) || 0;

    // Check limits
    if (callsLastMinute >= endpointLimit.max_calls_per_minute) {
      return {
        allowed: false,
        message: `Rate limit exceeded: ${endpointLimit.max_calls_per_minute} calls per minute`,
        remainingCalls: 0,
        resetTime: new Date(oneMinuteAgo.getTime() + 60000)
      };
    }

    if (callsLastHour >= endpointLimit.max_calls_per_hour) {
      return {
        allowed: false,
        message: `Rate limit exceeded: ${endpointLimit.max_calls_per_hour} calls per hour`,
        remainingCalls: 0,
        resetTime: new Date(oneHourAgo.getTime() + 3600000)
      };
    }

    if (callsLastDay >= endpointLimit.max_calls_per_day) {
      return {
        allowed: false,
        message: `Rate limit exceeded: ${endpointLimit.max_calls_per_day} calls per day`,
        remainingCalls: 0,
        resetTime: new Date(oneDayAgo.getTime() + 86400000)
      };
    }

    // Increment counter
    const windowStart = new Date(Math.floor(now.getTime() / 60000) * 60000);
    await supabase.rpc('increment_rate_limit', {
      _user_id: userId,
      _endpoint_name: endpointName,
      _window_start: windowStart.toISOString(),
      _environment_mode: environmentMode
    });

    return {
      allowed: true,
      message: 'Request allowed',
      remainingCalls: endpointLimit.max_calls_per_minute - callsLastMinute - 1
    };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return { allowed: true, message: 'Rate limit check failed, allowing request' };
  }
}

export async function checkBudgetLimit(
  userId: string,
  environmentMode: 'sandbox' | 'production',
  estimatedCost: number
): Promise<BudgetCheckResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: budget, error } = await supabase
      .from('user_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('environment_mode', environmentMode)
      .eq('period_start', periodStart)
      .single();

    if (error || !budget) {
      console.error('Budget check error:', error);
      return { allowed: false, message: 'No budget configured' };
    }

    // Check monthly limit
    if (budget.current_spending + estimatedCost > budget.monthly_budget) {
      return {
        allowed: false,
        message: `Monthly budget exceeded. Current: $${budget.current_spending.toFixed(2)}, Limit: $${budget.monthly_budget.toFixed(2)}`,
        currentSpending: budget.current_spending,
        limit: budget.monthly_budget
      };
    }

    // Check daily limit for sandbox
    if (environmentMode === 'sandbox' && budget.daily_limit) {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRuns } = await supabase
        .from('model_test_runs')
        .select('total_cost')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      const dailyTotal = todayRuns?.reduce((sum, run) => sum + (run.total_cost || 0), 0) || 0;

      if (dailyTotal + estimatedCost > budget.daily_limit) {
        return {
          allowed: false,
          message: `Daily sandbox limit exceeded. Current: $${dailyTotal.toFixed(2)}, Limit: $${budget.daily_limit.toFixed(2)}`,
          currentSpending: dailyTotal,
          limit: budget.daily_limit
        };
      }
    }

    return { 
      allowed: true, 
      message: 'Budget check passed',
      currentSpending: budget.current_spending,
      limit: budget.monthly_budget
    };
  } catch (error) {
    console.error('Budget check exception:', error);
    return { allowed: true, message: 'Budget check failed, allowing request' };
  }
}
