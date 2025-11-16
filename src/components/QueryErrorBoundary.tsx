import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class QueryErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    console.error('QueryErrorBoundary caught an error:', error);
  }

  getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication error. Please sign in again.';
    }
    if (message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    return 'An error occurred while loading data. Please try again.';
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
      this.props.onReset?.();
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Data Loading Error</CardTitle>
            </div>
            <CardDescription>{this.getUserFriendlyMessage(this.state.error)}</CardDescription>
          </CardHeader>
          <CardContent>
            {this.state.retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Retry attempts: {this.state.retryCount} / {this.maxRetries}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {canRetry ? (
              <Button onClick={this.handleRetry} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            ) : (
              <Button onClick={this.handleReset} size="sm" variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}
