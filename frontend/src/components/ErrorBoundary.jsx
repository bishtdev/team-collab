import { Component } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Kiln error boundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-surface p-8 text-center shadow-card">
            <div className="space-y-1.5">
              <h1 className="text-h2 font-semibold text-foreground">
                Something broke on this screen
              </h1>
              <p className="text-small text-muted-foreground">
                Try again to get back to your workspace. Nothing you saved was lost.
              </p>
            </div>
            <Button onClick={() => this.setState({ error: null })}>
              <RotateCcw className="size-4" strokeWidth={1.75} />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
