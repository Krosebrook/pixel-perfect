import { AlertCircle, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormattedError {
  error: string;
  field?: string;
  code: string;
  suggestions?: string[];
}

interface ErrorMessageProps {
  errors: FormattedError[] | FormattedError;
  className?: string;
}

export const ErrorMessage = ({ errors, className = "" }: ErrorMessageProps) => {
  const errorArray = Array.isArray(errors) ? errors : [errors];

  if (errorArray.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {errorArray.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {error.field ? `${error.field}: ` : ''}{error.error}
          </AlertTitle>
          {error.suggestions && error.suggestions.length > 0 && (
            <AlertDescription className="mt-2">
              <div className="flex items-start gap-2 text-sm">
                <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <ul className="list-disc list-inside space-y-1">
                  {error.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          )}
        </Alert>
      ))}
    </div>
  );
};
