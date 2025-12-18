import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface SessionTimeoutWarningProps {
  open: boolean;
  remainingSeconds: number;
  onStaySignedIn: () => void;
  onLogOut: () => void;
}

export function SessionTimeoutWarning({
  open,
  remainingSeconds,
  onStaySignedIn,
  onLogOut,
}: SessionTimeoutWarningProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} seconds`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Your session is about to expire due to inactivity.
            </p>
            <p className="text-lg font-semibold text-foreground">
              Time remaining: {formatTime(remainingSeconds)}
            </p>
            <p>
              Would you like to stay signed in?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogOut}>
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={onStaySignedIn}>
            Stay Signed In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
