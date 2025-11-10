import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  variant?: 'default' | 'minimal' | 'card';
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  variant = 'default',
  className = '',
}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                         errorMessage.toLowerCase().includes('fetch') ||
                         errorMessage.toLowerCase().includes('timeout');
  
  const isServerError = errorMessage.toLowerCase().includes('server') ||
                        errorMessage.toLowerCase().includes('500') ||
                        errorMessage.toLowerCase().includes('internal');

  const getErrorIcon = () => {
    if (isNetworkError) return '';
    if (isServerError) return '';
    return '';
  };

  const getErrorTitle = () => {
    if (isNetworkError) return 'Connection Error';
    if (isServerError) return 'Server Error';
    return 'Error';
  };

  const getErrorSuggestion = () => {
    if (isNetworkError) return 'Please check your internet connection and try again.';
    if (isServerError) return 'Our servers are experiencing issues. Please try again in a moment.';
    return 'Something went wrong. Please try again.';
  };

  if (variant === 'minimal') {
    return (
      <div className={`text-destructive text-sm ${className}`}>
        {errorMessage}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-lg">{getErrorIcon()}</span>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium text-destructive">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getErrorSuggestion()}
            </p>
            {import.meta.env.DEV && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {errorMessage}
                </pre>
              </details>
            )}
            {onRetry && (
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}>
      <div className="text-4xl">{getErrorIcon()}</div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-destructive">
          {getErrorTitle()}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {getErrorSuggestion()}
        </p>
      </div>
      
      {import.meta.env.DEV && (
        <details className="text-left bg-muted p-4 rounded-lg text-sm max-w-md">
          <summary className="cursor-pointer font-medium mb-2">
            Technical Details
          </summary>
          <pre className="whitespace-pre-wrap text-xs">
            {errorMessage}
          </pre>
        </details>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
};