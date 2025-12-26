/**
 * @fileoverview Remember Me checkbox component with extended session functionality.
 * Extends user session duration to 30 days when checked.
 */

import { Checkbox } from '@/components/ui/checkbox';
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
      <Checkbox
        id="remember-me"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className="mt-0.5"
        aria-describedby="remember-me-description"
      />
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
