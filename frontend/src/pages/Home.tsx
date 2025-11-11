import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Recipe, RecipeFilters, PaginatedRecipeResponse } from '@/types/recipe';
import { RecipeApiService } from '@/api';
import { RecipeTable, FilterBar, Pagination, RecipeDrawer, RecipeForm } from '@/components';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const Home: React.FC = () => {
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);


  const [filters, setFilters] = useState<RecipeFilters>({});
  const [pendingFilters, setPendingFilters] = useState<RecipeFilters>({});

  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value.trim() !== '');
  }, [filters]);

  
  const fetchRecipes = useCallback(async (
    page: number, 
    limit: number, 
    searchFilters: RecipeFilters,
    signal?: AbortSignal
  ) => {
    try {
      setLoading(true);
      setError(null);

      let response: PaginatedRecipeResponse;

      const hasFilters = Object.values(searchFilters).some(value => value && value.trim() !== '');

      if (hasFilters) {
        const searchResponse = await RecipeApiService.searchRecipes(searchFilters, signal);
        
        if (signal?.aborted) {
          return;
        }
        
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
        response = await RecipeApiService.getRecipes(page, limit, signal);
        
        if (signal?.aborted) {
          return;
        }
      }

      setRecipes(response.data);
      setCurrentPage(response.page);
      setTotalRecipes(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      if (signal?.aborted || (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError'))) {
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
  }, []);

  
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, {}, abortControllerRef.current.signal);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageSize, fetchRecipes]);

  const handlePageChange = useCallback((page: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(page, pageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize, filters]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, newPageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, filters]);

  
  const handleFilterChange = useCallback((newFilters: RecipeFilters) => {
    setPendingFilters(newFilters);
    
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(newFilters);
      setCurrentPage(1);
      
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      fetchRecipes(1, pageSize, newFilters, abortControllerRef.current.signal);
    }, 500); 
  }, [fetchRecipes, pageSize]);

  
  const handleSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setFilters(pendingFilters);
    setCurrentPage(1);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, pendingFilters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize, pendingFilters]);

  
  const handleReset = useCallback(() => {
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const emptyFilters: RecipeFilters = {};
    setFilters(emptyFilters);
    setPendingFilters(emptyFilters);
    setCurrentPage(1);
  
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    fetchRecipes(1, pageSize, emptyFilters, abortControllerRef.current.signal);
  }, [fetchRecipes, pageSize]);

  
  const handleRetry = useCallback(() => {
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  
    abortControllerRef.current = new AbortController();
    fetchRecipes(currentPage, pageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, currentPage, pageSize, filters]);

  const handleRecipeClick = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDrawerOpen(true);
  }, []);
  const handleDrawerClose = useCallback((open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      setSelectedRecipe(null);
    }
  }, []);

  const handleDeleteRecipe = useCallback(async (recipeId: number) => {
    try {
      setDeleting(true);
      await RecipeApiService.deleteRecipe(recipeId);
      
      // Refresh the recipes list
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      await fetchRecipes(currentPage, pageSize, filters, abortControllerRef.current.signal);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recipe';
      setError(errorMessage);
      console.error('Error deleting recipe:', err);
    } finally {
      setDeleting(false);
    }
  }, [fetchRecipes, currentPage, pageSize, filters]);

  const handleCreateRecipe = useCallback(() => {
    setFormMode('create');
    setEditingRecipe(null);
    setFormOpen(true);
  }, []);

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    setFormMode('edit');
    setEditingRecipe(recipe);
    setFormOpen(true);
  }, []);

  const handleFormSave = useCallback(async () => {
    // Refresh the recipes list
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    await fetchRecipes(currentPage, pageSize, filters, abortControllerRef.current.signal);
  }, [fetchRecipes, currentPage, pageSize, filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-baseline">
          <div className="text-start space-y-2">
            <h1 className="text-3xl font-bold">Recipe Management</h1>
            <p className="text-muted-foreground">
              Browse and search through our collection of recipes
            </p>
          </div>
          <Button onClick={handleCreateRecipe} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Recipe
          </Button>
        </div>

        <FilterBar
          filters={pendingFilters}
          onFiltersChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
        />

        <RecipeTable
          recipes={recipes}
          onRecipeClick={handleRecipeClick}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          hasFilters={hasActiveFilters}
          onClearFilters={handleReset}
        />

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

        <RecipeDrawer
          recipe={selectedRecipe}
          open={drawerOpen}
          onOpenChange={handleDrawerClose}
          onDelete={handleDeleteRecipe}
          onEdit={handleEditRecipe}
          deleting={deleting}
        />

        <RecipeForm
          recipe={editingRecipe}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSave={handleFormSave}
          mode={formMode}
        />
      </div>
    </div>
  );
};