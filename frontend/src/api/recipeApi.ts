import axios from 'axios';
import type { PaginatedRecipeResponse, SearchRecipeResponse, RecipeFilters } from '@/types/recipe';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging (development only)
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.params);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Create user-friendly error messages
    let userMessage = 'An unexpected error occurred';
    
    if (error.code === 'ECONNABORTED') {
      userMessage = 'Request timed out. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      userMessage = 'Network error. Please check your connection.';
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;
      
      switch (status) {
        case 400:
          userMessage = serverMessage || 'Invalid request. Please check your input.';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          break;
        case 500:
          userMessage = 'Server error. Please try again later.';
          break;
        case 503:
          userMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          userMessage = serverMessage || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      // Request was made but no response received
      userMessage = 'No response from server. Please check your connection.';
    }
    
    // Create a new error with user-friendly message
    const enhancedError = new Error(userMessage);
    enhancedError.name = error.name;
    enhancedError.cause = error;
    
    return Promise.reject(enhancedError);
  }
);

export class RecipeApiService {
  /**
   * Fetch paginated recipes
   * @param page - Page number (default: 1)
   * @param limit - Number of recipes per page (default: 15)
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<PaginatedRecipeResponse>
   */
  static async getRecipes(
    page: number = 1, 
    limit: number = 15, 
    signal?: AbortSignal
  ): Promise<PaginatedRecipeResponse> {
    try {
      const response = await apiClient.get<PaginatedRecipeResponse>('/recipes', {
        params: { page, limit },
        signal
      });
      return response.data;
    } catch (error) {
      // Error is already enhanced by the interceptor
      throw error;
    }
  }

  /**
   * Search recipes with filters
   * @param filters - Search and filter criteria
   * @param signal - AbortSignal for request cancellation
   * @returns Promise<SearchRecipeResponse>
   */
  static async searchRecipes(
    filters: RecipeFilters, 
    signal?: AbortSignal
  ): Promise<SearchRecipeResponse> {
    try {
      // Remove empty filter values
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value.trim() !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await apiClient.get<SearchRecipeResponse>('/recipes/search', {
        params: cleanFilters,
        signal
      });
      return response.data;
    } catch (error) {
      // Error is already enhanced by the interceptor
      throw error;
    }
  }

  /**
   * Get available cuisines (utility method for dropdown)
   * This would typically be a separate endpoint, but for now we'll implement it client-side
   * @returns Promise<string[]>
   */
  static async getCuisines(): Promise<string[]> {
    try {

      return [
        'Italian',
        'Chinese',
        'Mexican',
        'Indian',
        'French',
        'Japanese',
        'Thai',
        'Greek',
        'Spanish',
        'American',
        'Mediterranean',
        'Korean',
        'Vietnamese',
        'Lebanese',
        'Moroccan'
      ];
    } catch (error) {
      // Error is already enhanced by the interceptor
      throw error;
    }
  }
}

export default RecipeApiService;