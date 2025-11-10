import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Recipe, RecipeFilters, PaginatedRecipeResponse } from '@/types/recipe';
import { RecipeApiService } from '@/api';
import { RecipeTable, FilterBar, Pagination, RecipeDrawer } from '@/components';

export const Home: React.FC = () => {
  // Recipe data state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [pendingFilters, setPendingFilters] = useState<RecipeFilters>({});

  // Drawer state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Refs for debouncing and cleanup
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized function to check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value.trim() !== '');
  }, [filters]);

  // Fetch recipes function with useCallback for performance and abort controller for cleanup
  const fetchRecipes = useCallback(async (
    page: number = currentPage, 
    limit: number = pageSize, 
    searchFilters: RecipeFilters = filters,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);
      setError(null);

      let response: PaginatedRecipeResponse;

      // Check if any filters are applied
      const hasFilters = Object.values(searchFilters).some(value => value && value.trim() !== '');

      if (hasFilters) {
        // Use search endpoint with filters
        const searchResponse = await RecipeApiService.searchRecipes(searchFilters, signal);
        
        // Check if request was aborted
        if (signal?.aborted) {
          return;
        }
        
        // For search results, we need to manually paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = searchResponse.data.slice(startIndex, endIndex);
        
        response = {
          page,
          limit,
          total: searchResponse.data.length,
          totalPages: Math.ceil(searchResponse.data.length / limit),
          data: paginatedData
        };
      } else {
        // Use regular paginated endpoint
        response = await RecipeApiService.getRecipes(page, limit, signal);
        
        // Check if request was aborted
        if (signal?.aborted) {
          return;
        }
      }

      setRecipes(response.data);
      setCurrentPage(response.page);
      setTotalRecipes(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      // Don't show error if request was aborted
      if (signal?.aborted) {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recipes';
      setError(errorMessage);
      setRecipes([]);
      console.error('Error fetching recipes:', err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, filters]);

  // Initial data fetch
  useEffect(() => {
    // Create initial abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, {}, abortControllerRef.current.signal);
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageSize]);

  // Handle page change with useCallback for performance
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(page, pageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize, filters]);

  // Handle page size change with useCallback
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, newPageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, filters]);

  // Handle filter change with debouncing for better UX
  const handleFilterChange = useCallback((newFilters: RecipeFilters) => {
    setPendingFilters(newFilters);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(newFilters);
      setCurrentPage(1);
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      fetchRecipes(1, pageSize, newFilters, abortControllerRef.current.signal);
    }, 500); // 500ms debounce
  }, [fetchRecipes, pageSize]);

  // Handle search with useCallback (immediate search)
  const handleSearch = useCallback(() => {
    // Clear any pending debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Apply pending filters immediately
    setFilters(pendingFilters);
    setCurrentPage(1);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, pendingFilters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize, pendingFilters]);

  // Handle reset with useCallback
  const handleReset = useCallback(() => {
    // Clear any pending debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const emptyFilters: RecipeFilters = {};
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    setCurrentPage(1);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, emptyFilters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize]);

  // Handle retry with useCallback
  const handleRetry = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(currentPage, pageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, currentPage, pageSize, filters]);

  // Handle recipe selection with useCallback
  const handleRecipeClick = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDrawerOpen(true);
  }, []);

  // Handle drawer close with useCallback
  const handleDrawerClose = useCallback((open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedRecipe(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Recipe Management</h1>
          <p className="text-muted-foreground">
            Browse and search through our collection of recipes
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={pendingFilters}
          onFiltersChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        {/* Recipe Table */}
        <RecipeTable
          recipes={recipes}
          onRecipeClick={handleRecipeClick}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          hasFilters={hasActiveFilters}
          onClearFilters={handleReset}
        />

        {/* Pagination */}
        {!loading && recipes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalRecipes}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Recipe Drawer */}
        <RecipeDrawer
          recipe={selectedRecipe}
          open={drawerOpen}
          onOpenChange={handleDrawerClose}
        />
      </div>
    </div>
  );
};