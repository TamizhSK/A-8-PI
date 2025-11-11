import type { Recipe, PaginatedRecipeResponse, SearchRecipeResponse, RecipeFilters } from '@/types/recipe';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(
    message: string,
    status?: number,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = (errorData as { message: string }).message;
      } else if (errorData && typeof errorData === 'object' && 'error' in errorData) {
        errorMessage = (errorData as { error: string }).error;
      }
    } catch {
      // If JSON parsing fails, use the default error message
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  if (import.meta.env.DEV) {
    console.log('API Request:', mergedOptions.method || 'GET', url);
  }

  const response = await fetch(url, mergedOptions);
  return handleResponse<T>(response);
}

export class RecipeApiService {
  static async getRecipes(
    page: number = 1, 
    limit: number = 10, 
    signal?: AbortSignal
  ): Promise<PaginatedRecipeResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return makeRequest<PaginatedRecipeResponse>(`/recipes?${params}`, {}, signal);
  }

  static async getRecipeById(id: number, signal?: AbortSignal): Promise<{ data: Recipe }> {
    return makeRequest<{ data: Recipe }>(`/recipes/${id}`, {}, signal);
  }

  static async searchRecipes(
    filters: RecipeFilters, 
    signal?: AbortSignal
  ): Promise<SearchRecipeResponse> {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    const params = new URLSearchParams(cleanFilters);
    return makeRequest<SearchRecipeResponse>(`/recipes/search?${params}`, {}, signal);
  }

  static async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at'>): Promise<{ message: string; data: Recipe }> {
    return makeRequest<{ message: string; data: Recipe }>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  static async updateRecipe(id: number, recipe: Partial<Omit<Recipe, 'id' | 'created_at'>>): Promise<{ message: string; data: Recipe }> {
    return makeRequest<{ message: string; data: Recipe }>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  }

  static async deleteRecipe(id: number): Promise<{ message: string; data: { id: number; title: string } }> {
    return makeRequest<{ message: string; data: { id: number; title: string } }>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  static async getCuisines(): Promise<string[]> {
    const response = await makeRequest<{ data: string[]; count: number }>('/recipes/cuisines/list');
    return response.data;
  }
}

export default RecipeApiService;