export interface NutritionalData {
  calories?: number;
  carbohydrateContent?: string;
  cholesterolContent?: string;
  fiberContent?: string;
  proteinContent?: string;
  saturatedFatContent?: string;
  sodiumContent?: string;
  sugarContent?: string;
  fatContent?: string;
}

export interface Recipe {
  id: number;
  cuisine: string;
  title: string;
  rating?: number;
  prep_time?: number;
  cook_time?: number;
  total_time?: number;
  description?: string;
  nutrients?: NutritionalData;
  serves?: string;
  created_at: string;
}

export interface PaginatedRecipeResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Recipe[];
}

export interface SearchRecipeResponse {
  data: Recipe[];
}

export interface RecipeFilters {
  title?: string;
  cuisine?: string;
  rating?: string;
  total_time?: string;
  calories?: string;
}