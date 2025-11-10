import React from 'react';
import type { Recipe } from '@/types/recipe';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableRowSkeleton } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { NoRecipesFound } from './EmptyState';

interface RecipeTableProps {
  recipes: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

const StarRating: React.FC<{ rating?: number }> = ({ rating }) => {
  if (!rating) return <span className="text-muted-foreground">N/A</span>;
  
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <span key={i} className="text-yellow-400">☆</span>
      );
    } else {
      stars.push(
        <span key={i} className="text-gray-300">☆</span>
      );
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      <span className="text-sm text-muted-foreground ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatTime = (minutes?: number): string => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const RecipeTable: React.FC<RecipeTableProps> = ({
  recipes,
  onRecipeClick,
  loading = false,
  error = null,
  onRetry,
  hasFilters = false,
  onClearFilters,
}) => {
  // Show error state
  if (error && !loading) {
    return (
      <div className="rounded-md border">
        <ErrorDisplay 
          error={error} 
          onRetry={onRetry}
          variant="card"
          className="m-8"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead className="w-[15%]">Cuisine</TableHead>
              <TableHead className="w-[20%]">Rating</TableHead>
              <TableHead className="w-[15%]">Total Time</TableHead>
              <TableHead className="w-[10%]">Serves</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRowSkeleton columns={5} />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="h-64">
          <NoRecipesFound 
            hasFilters={hasFilters}
            onClearFilters={onClearFilters}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead className="w-[15%]">Cuisine</TableHead>
            <TableHead className="w-[20%]">Rating</TableHead>
            <TableHead className="w-[15%]">Total Time</TableHead>
            <TableHead className="w-[10%]">Serves</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((recipe) => (
            <TableRow
              key={recipe.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onRecipeClick(recipe)}
            >
              <TableCell className="font-medium">
                <div title={recipe.title}>
                  {truncateText(recipe.title)}
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">
                  {recipe.cuisine || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                <StarRating rating={recipe.rating} />
              </TableCell>
              <TableCell>
                {formatTime(recipe.total_time)}
              </TableCell>
              <TableCell>
                {recipe.serves || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};