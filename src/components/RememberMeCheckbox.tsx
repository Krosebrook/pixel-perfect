/**
 * @fileoverview Remember Me checkbox component with extended session functionality.
 * Extends user session duration to 30 days when checked.
 */

import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

interface RememberMeCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

// Session duration constants
export const SESSION_DURATION = {
  DEFAULT: 60 * 60 * 24, // 1 day in seconds
  EXTENDED: 60 * 60 * 24 * 30, // 30 days in seconds
} as const;

export function RememberMeCheckbox({ 
  checked, 
  onCheckedChange, 
  disabled = false 
}: RememberMeCheckboxProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id="remember-me"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 accent-primary"
          aria-describedby="remember-me-description"
        />
      </div>
      <div className="grid gap-1">
        <Label 
          htmlFor="remember-me" 
          className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            Remember me for 30 days
          </span>
        </Label>
        <p 
          id="remember-me-description" 
          className="text-xs text-muted-foreground"
        >
          Keep me signed in on this device. For security, don't use on shared computers.
        </p>
      </div>
    </div>
  );
}
