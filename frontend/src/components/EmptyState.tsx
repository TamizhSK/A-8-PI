import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return '🔍';
      case 'error':
        return '⚠️';
      default:
        return '📋';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}>
      <div className="text-6xl opacity-50">
        {icon || getDefaultIcon()}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground max-w-md">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Specific empty state components for common scenarios
export const NoRecipesFound: React.FC<{
  hasFilters?: boolean;
  onClearFilters?: () => void;
}> = ({ hasFilters = false, onClearFilters }) => {
  if (hasFilters) {
    return (
      <EmptyState
        icon="🔍"
        title="No recipes match your search"
        description="Try adjusting your filters or search terms to find more recipes."
        action={onClearFilters ? {
          label: "Clear Filters",
          onClick: onClearFilters
        } : undefined}
        variant="search"
      />
    );
  }

  return (
    <EmptyState
      icon="🍽️"
      title="No recipes available"
      description="There are currently no recipes in the database. Please check back later."
    />
  );
};

export const NoDataAvailable: React.FC<{
  dataType: string;
  onRetry?: () => void;
}> = ({ dataType, onRetry }) => {
  return (
    <EmptyState
      icon="📭"
      title={`No ${dataType} available`}
      description={`We couldn't find any ${dataType} to display.`}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
    />
  );
};