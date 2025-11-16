import { Component, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  navigate?: (path: string) => void;
  location?: { pathname: string };
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    console.error('RouteErrorBoundary caught an error:', error);
  }

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    this.props.navigate?.('/');
  };

  render() {
    if (this.state.hasError) {
      const isNotFound = this.state.error?.message.includes('404');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>{isNotFound ? 'Page Not Found' : 'Route Error'}</CardTitle>
              </div>
              <CardDescription>
                {isNotFound
                  ? "The page you're looking for doesn't exist or has been moved."
                  : 'An error occurred while loading this page.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {this.props.location && (
                <p className="text-sm text-muted-foreground">
                  Path: <code className="font-mono">{this.props.location.pathname}</code>
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleGoBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={this.handleGoHome} variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to inject hooks
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <RouteErrorBoundaryClass navigate={navigate} location={location}>
      {children}
    </RouteErrorBoundaryClass>
  );
}
