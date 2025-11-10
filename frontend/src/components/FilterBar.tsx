import React from 'react';
import type { RecipeFilters } from '@/types/recipe';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

const cuisineOptions = [
  'american',
  'asian',
  'british',
  'caribbean',
  'central_europe',
  'chinese',
];

const operatorOptions = [
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '=', label: '=' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  loading = false,
}) => {
  const handleInputChange = (field: keyof RecipeFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const parseNumericFilter = (value: string) => {
    if (!value) return { operator: '', number: '' };
    
    const match = value.match(/^(>=|<=|>|<|=)?(.*)$/);
    if (match) {
      return {
        operator: match[1] || '=',
        number: match[2] || '',
      };
    }
    return { operator: '=', number: value };
  };

  const formatNumericFilter = (operator: string, number: string) => {
    if (!number) return '';
    return operator === '=' ? number : `${operator}${number}`;
  };

  const ratingFilter = parseNumericFilter(filters.rating || '');
  const timeFilter = parseNumericFilter(filters.total_time || '');
  const caloriesFilter = parseNumericFilter(filters.calories || '');

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <div className="space-y-2">
          <label className="text-sm font-medium">Recipe Title</label>
          <Input
            placeholder="Search by title..."
            value={filters.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cuisine</label>
          <Select
            value={filters.cuisine || 'all'}
            onValueChange={(value) => handleInputChange('cuisine', value === 'all' ? '' : value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cuisine..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisineOptions.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex gap-2">
            <Select
              value={ratingFilter.operator || '='}
              onValueChange={(operator) => {
                const newValue = formatNumericFilter(operator, ratingFilter.number);
                handleInputChange('rating', newValue);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0-5"
              min="0"
              max="5"
              step="0.1"
              value={ratingFilter.number}
              onChange={(e) => {
                const newValue = formatNumericFilter(ratingFilter.operator, e.target.value);
                handleInputChange('rating', newValue);
              }}
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Total Time (minutes)</label>
          <div className="flex gap-2">
            <Select
              value={timeFilter.operator || '='}
              onValueChange={(operator) => {
                const newValue = formatNumericFilter(operator, timeFilter.number);
                handleInputChange('total_time', newValue);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="e.g. 30"
              min="0"
              value={timeFilter.number}
              onChange={(e) => {
                const newValue = formatNumericFilter(timeFilter.operator, e.target.value);
                handleInputChange('total_time', newValue);
              }}
              disabled={loading}
            />
          </div>
        </div>


        <div className="space-y-2">
          <label className="text-sm font-medium">Calories</label>
          <div className="flex gap-2">
            <Select
              value={caloriesFilter.operator || '='}
              onValueChange={(operator) => {
                const newValue = formatNumericFilter(operator, caloriesFilter.number);
                handleInputChange('calories', newValue);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="e.g. 500"
              min="0"
              value={caloriesFilter.number}
              onChange={(e) => {
                const newValue = formatNumericFilter(caloriesFilter.operator, e.target.value);
                handleInputChange('calories', newValue);
              }}
              disabled={loading}
            />
          </div>
        </div>
      </div>


      <div className="flex gap-2 pt-2">
        <Button 
          onClick={onSearch} 
          disabled={loading}
          className="flex-1 md:flex-none"
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <Button 
          variant="outline" 
          onClick={onReset}
          disabled={loading}
        >
          Reset
        </Button>
      </div>
    </div>
  );
};