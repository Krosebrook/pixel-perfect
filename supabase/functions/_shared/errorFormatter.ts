import { ZodError } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export interface FormattedError {
  error: string;
  field?: string;
  code: string;
  suggestions?: string[];
}

/**
 * Converts Zod validation errors into user-friendly error messages
 */
export function formatValidationError(error: ZodError): FormattedError[] {
  return error.errors.map((err) => {
    const field = err.path.join('.');
    const code = err.code;
    
    let message = err.message;
    const suggestions: string[] = [];

    // Customize messages based on error type
    switch (err.code) {
      case "invalid_type":
        message = `${field ? field + ': ' : ''}Expected ${err.expected}, but received ${err.received}`;
        suggestions.push(`Ensure ${field || 'the field'} is of type ${err.expected}`);
        break;
      
      case "invalid_enum_value":
        message = `${field ? field + ': ' : ''}Invalid value. Expected one of: ${err.options.join(', ')}`;
        suggestions.push(`Use one of these valid options: ${err.options.join(', ')}`);
        break;
      
      case "too_small":
        if (err.type === "string") {
          message = `${field ? field + ': ' : ''}Must be at least ${err.minimum} characters`;
          suggestions.push(`Add more detail to meet the minimum length`);
        } else if (err.type === "array") {
          message = `${field ? field + ': ' : ''}Must contain at least ${err.minimum} items`;
          suggestions.push(`Add at least ${err.minimum} items`);
        }
        break;
      
      case "too_big":
        if (err.type === "string") {
          message = `${field ? field + ': ' : ''}Must be less than ${err.maximum} characters`;
          suggestions.push(`Shorten to ${err.maximum} characters or less`);
        } else if (err.type === "array") {
          message = `${field ? field + ': ' : ''}Must contain at most ${err.maximum} items`;
          suggestions.push(`Remove items to stay under ${err.maximum}`);
        }
        break;
      
      case "invalid_string":
        if (err.validation === "email") {
          message = `${field ? field + ': ' : ''}Invalid email format`;
          suggestions.push("Use a valid email address (e.g., user@example.com)");
        } else if (err.validation === "uuid") {
          message = `${field ? field + ': ' : ''}Invalid UUID format`;
          suggestions.push("Provide a valid UUID");
        }
        break;
    }

    return {
      error: message,
      field: field || undefined,
      code,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  });
}

/**
 * Creates a formatted authentication error
 */
export function formatAuthError(message: string = "Authentication required"): FormattedError {
  return {
    error: message,
    code: "AUTH_ERROR",
    suggestions: [
      "Ensure you're logged in",
      "Check that your session hasn't expired",
      "Verify your authentication token is valid"
    ],
  };
}

/**
 * Creates a formatted rate limit error
 */
export function formatRateLimitError(limit: string, resetTime?: Date): FormattedError {
  const suggestions = [
    "Wait a few minutes before trying again",
    "Consider upgrading to production mode for higher limits"
  ];
  
  if (resetTime) {
    const minutes = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
    suggestions.unshift(`Rate limit resets in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  return {
    error: `Rate limit exceeded: ${limit}`,
    code: "RATE_LIMIT_EXCEEDED",
    suggestions,
  };
}

/**
 * Creates a formatted budget error
 */
export function formatBudgetError(currentSpending: number, limit: number): FormattedError {
  return {
    error: `Budget limit exceeded: $${currentSpending.toFixed(4)} / $${limit.toFixed(2)}`,
    code: "BUDGET_EXCEEDED",
    suggestions: [
      "Increase your monthly budget in settings",
      "Wait until the start of next month for reset",
      "Consider optimizing your prompt usage"
    ],
  };
}

/**
 * Creates a generic formatted error
 */
export function formatGenericError(error: Error | string, code: string = "INTERNAL_ERROR"): FormattedError {
  const message = typeof error === "string" ? error : error.message;
  
  return {
    error: message,
    code,
    suggestions: [
      "Try again in a moment",
      "If the problem persists, contact support"
    ],
  };
}

/**
 * Converts any error into a consistent error response
 */
export function formatErrorResponse(error: unknown): Response {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  let status = 500;
  let errors: FormattedError[];

  if (error instanceof ZodError) {
    status = 400;
    errors = formatValidationError(error);
  } else if (error instanceof Error) {
    errors = [formatGenericError(error)];
  } else {
    errors = [formatGenericError("An unexpected error occurred", "UNKNOWN_ERROR")];
  }

  return new Response(
    JSON.stringify({
      success: false,
      errors,
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
