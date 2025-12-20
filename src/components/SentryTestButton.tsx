import { Button } from '@/components/ui/button';
import { captureException, captureMessage } from '@/services/error-monitoring';
import { useToast } from '@/hooks/use-toast';
import { Bug } from 'lucide-react';

/**
 * Development-only button to test Sentry error capturing
 * Only renders in non-production environments
 */
export function SentryTestButton() {
  const { toast } = useToast();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const triggerTestError = () => {
    try {
      throw new Error('Test error from SentryTestButton - this is intentional!');
    } catch (error) {
      captureException(error as Error, {
        component: 'SentryTestButton',
        action: 'manual_test',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Test error triggered',
        description: 'Check your Sentry dashboard (errors only sent in production) or console in dev mode.',
      });
    }
  };

  const triggerTestMessage = () => {
    captureMessage('Test message from SentryTestButton - Sentry is working!', 'info');
    
    toast({
      title: 'Test message sent',
      description: 'Check your Sentry dashboard or console.',
    });
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={triggerTestMessage}
        className="bg-background/80 backdrop-blur-sm"
      >
        <Bug className="h-4 w-4 mr-1" />
        Test Message
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={triggerTestError}
        className="backdrop-blur-sm"
      >
        <Bug className="h-4 w-4 mr-1" />
        Test Error
      </Button>
    </div>
  );
}
