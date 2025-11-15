-- Fix search path for update_budget_spending function
CREATE OR REPLACE FUNCTION public.update_budget_spending()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current spending for the user's current period
  INSERT INTO public.user_budgets (user_id, current_spending, period_start)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.total_cost, 0),
    date_trunc('month', now())
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    current_spending = public.user_budgets.current_spending + COALESCE(NEW.total_cost, 0),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;