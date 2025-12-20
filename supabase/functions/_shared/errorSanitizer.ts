/**
 * Error sanitization utilities to prevent information leakage
 * Never expose internal error details, API keys, database structure, etc. to clients
 */

export interface SanitizedError {
  message: string;
  statusCode: number;
}

/**
 * Sanitizes error messages for safe client exposure
 * Logs detailed error server-side while returning generic messages to clients
 */
export function sanitizeError(error: unknown, context: string = 'request'): SanitizedError {
  // Log detailed error server-side for debugging
  console.error(`Error in ${context}:`, error);
  
  // Default generic error
  let message = 'An error occurred while processing your request';
  let statusCode = 500;
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Authentication/Authorization errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('unauthenticated')) {
      message = 'Unauthorized';
      statusCode = 401;
    }
    // Forbidden errors
    else if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      message = 'Access denied';
      statusCode = 403;
    }
    // Rate limiting
    else if (errorMessage.includes('rate_limit') || errorMessage.includes('too many requests') || errorMessage.includes('quota')) {
      message = 'Too many requests. Please try again later.';
      statusCode = 429;
    }
    // API provider errors (OpenAI, Anthropic, etc.) - never expose details
    else if (errorMessage.includes('api') && (errorMessage.includes('error') || errorMessage.includes('failed'))) {
      message = 'External service temporarily unavailable';
      statusCode = 503;
    }
    // Configuration errors
    else if (errorMessage.includes('not configured') || errorMessage.includes('missing')) {
      message = 'Service configuration error';
      statusCode = 503;
    }
    // Validation errors (safe to expose in general terms)
    else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      message = 'Invalid request parameters';
      statusCode = 400;
    }
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      message = 'Request timed out. Please try again.';
      statusCode = 504;
    }
    // Network errors
    else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      message = 'Network error. Please check your connection.';
      statusCode = 503;
    }
    // All other errors get generic message to prevent information leakage
  }
  
  return { message, statusCode };
}

/**
 * Creates a JSON error response with sanitized message
 */
export function createErrorResponse(
  error: unknown, 
  context: string, 
  corsHeaders: Record<string, string>
): Response {
  const { message, statusCode } = sanitizeError(error, context);
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    { 
      status: statusCode, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
