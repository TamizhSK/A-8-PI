import React, { useState, useEffect } from 'react';
import type { Recipe, NutritionalData } from '@/types/recipe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RecipeApiService } from '@/api';

interface RecipeFormProps {
  recipe?: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recipe: Recipe) => void;
  mode: 'create' | 'edit';
}

export const RecipeForm: React.FC<RecipeFormProps> = ({
  recipe,
  open,
  onOpenChange,
  onSave,
  mode
}) => {
  const [formData, setFormData] = useState({
    cuisine: '',
    title: '',
    rating: '',
    prep_time: '',
    cook_time: '',
    total_time: '',
    description: '',
    serves: '',
    nutrients: {
      calories: '',
      carbohydrateContent: '',
      cholesterolContent: '',
      fiberContent: '',
      proteinContent: '',
      saturatedFatContent: '',
      sodiumContent: '',
      sugarContent: '',
      fatContent: ''
    }
  });

  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCuisines = async () => {
      try {
        setCuisinesLoading(true);
        const cuisineList = await RecipeApiService.getCuisines();
        setCuisines(cuisineList);
      } catch (error) {
        console.error('Failed to load cuisines:', error);
        // Fallback to a basic list if API fails
        setCuisines([
          'Italian', 'Chinese', 'Mexican', 'Indian', 'French', 
          'Japanese', 'Thai', 'Greek', 'Spanish', 'American'
        ]);
      } finally {
        setCuisinesLoading(false);
      }
    };
    loadCuisines();
  }, []);

  useEffect(() => {
    if (recipe && mode === 'edit') {
      setFormData({
        cuisine: recipe.cuisine || '',
        title: recipe.title || '',
        rating: recipe.rating?.toString() || '',
        prep_time: recipe.prep_time?.toString() || '',
        cook_time: recipe.cook_time?.toString() || '',
        total_time: recipe.total_time?.toString() || '',
        description: recipe.description || '',
        serves: recipe.serves || '',
        nutrients: {
          calories: recipe.nutrients?.calories?.toString() || '',
          carbohydrateContent: recipe.nutrients?.carbohydrateContent || '',
          cholesterolContent: recipe.nutrients?.cholesterolContent || '',
          fiberContent: recipe.nutrients?.fiberContent || '',
          proteinContent: recipe.nutrients?.proteinContent || '',
          saturatedFatContent: recipe.nutrients?.saturatedFatContent || '',
          sodiumContent: recipe.nutrients?.sodiumContent || '',
          sugarContent: recipe.nutrients?.sugarContent || '',
          fatContent: recipe.nutrients?.fatContent || ''
        }
      });
    } else if (mode === 'create') {
      setFormData({
        cuisine: '',
        title: '',
        rating: '',
        prep_time: '',
        cook_time: '',
        total_time: '',
        description: '',
        serves: '',
        nutrients: {
          calories: '',
          carbohydrateContent: '',
          cholesterolContent: '',
          fiberContent: '',
          proteinContent: '',
          saturatedFatContent: '',
          sodiumContent: '',
          sugarContent: '',
          fatContent: ''
        }
      });
    }
    setErrors({});
  }, [recipe, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cuisine.trim()) {
      newErrors.cuisine = 'Cuisine is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.rating && (isNaN(Number(formData.rating)) || Number(formData.rating) < 0 || Number(formData.rating) > 5)) {
      newErrors.rating = 'Rating must be between 0 and 5';
    }

    if (formData.prep_time && (isNaN(Number(formData.prep_time)) || Number(formData.prep_time) < 0)) {
      newErrors.prep_time = 'Prep time must be a positive number';
    }

    if (formData.cook_time && (isNaN(Number(formData.cook_time)) || Number(formData.cook_time) < 0)) {
      newErrors.cook_time = 'Cook time must be a positive number';
    }

    if (formData.total_time && (isNaN(Number(formData.total_time)) || Number(formData.total_time) < 0)) {
      newErrors.total_time = 'Total time must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const recipeData = {
        cuisine: formData.cuisine,
        title: formData.title,
        rating: formData.rating ? Number(formData.rating) : undefined,
        prep_time: formData.prep_time ? Number(formData.prep_time) : undefined,
        cook_time: formData.cook_time ? Number(formData.cook_time) : undefined,
        total_time: formData.total_time ? Number(formData.total_time) : undefined,
        description: formData.description || undefined,
        serves: formData.serves || undefined,
        nutrients: Object.values(formData.nutrients).some(v => v.trim()) ? {
          calories: formData.nutrients.calories ? Number(formData.nutrients.calories) : undefined,
          carbohydrateContent: formData.nutrients.carbohydrateContent || undefined,
          cholesterolContent: formData.nutrients.cholesterolContent || undefined,
          fiberContent: formData.nutrients.fiberContent || undefined,
          proteinContent: formData.nutrients.proteinContent || undefined,
          saturatedFatContent: formData.nutrients.saturatedFatContent || undefined,
          sodiumContent: formData.nutrients.sodiumContent || undefined,
          sugarContent: formData.nutrients.sugarContent || undefined,
          fatContent: formData.nutrients.fatContent || undefined
        } as NutritionalData : undefined
      };

      let result;
      if (mode === 'create') {
        result = await RecipeApiService.createRecipe(recipeData);
      } else {
        result = await RecipeApiService.updateRecipe(recipe!.id, recipeData);
      }

      onSave(result.data);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save recipe' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNutrientChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      nutrients: {
        ...prev.nutrients,
        [field]: value
      }
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === 'create' ? 'Create New Recipe' : 'Edit Recipe'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {errors.submit && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Recipe title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine *</Label>
              <Select 
                value={formData.cuisine} 
                onValueChange={(value) => handleInputChange('cuisine', value)}
                disabled={cuisinesLoading}
              >
                <SelectTrigger className={errors.cuisine ? 'border-red-500' : ''}>
                  <SelectValue placeholder={cuisinesLoading ? "Loading cuisines..." : "Select cuisine"} />
                </SelectTrigger>
                <SelectContent>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cuisine && <p className="text-sm text-red-600">{errors.cuisine}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                placeholder="4.5"
                className={errors.rating ? 'border-red-500' : ''}
              />
              {errors.rating && <p className="text-sm text-red-600">{errors.rating}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prep_time">Prep Time (min)</Label>
              <Input
                id="prep_time"
                type="number"
                min="0"
                value={formData.prep_time}
                onChange={(e) => handleInputChange('prep_time', e.target.value)}
                placeholder="15"
                className={errors.prep_time ? 'border-red-500' : ''}
              />
              {errors.prep_time && <p className="text-sm text-red-600">{errors.prep_time}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cook_time">Cook Time (min)</Label>
              <Input
                id="cook_time"
                type="number"
                min="0"
                value={formData.cook_time}
                onChange={(e) => handleInputChange('cook_time', e.target.value)}
                placeholder="30"
                className={errors.cook_time ? 'border-red-500' : ''}
              />
              {errors.cook_time && <p className="text-sm text-red-600">{errors.cook_time}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_time">Total Time (min)</Label>
              <Input
                id="total_time"
                type="number"
                min="0"
                value={formData.total_time}
                onChange={(e) => handleInputChange('total_time', e.target.value)}
                placeholder="45"
                className={errors.total_time ? 'border-red-500' : ''}
              />
              {errors.total_time && <p className="text-sm text-red-600">{errors.total_time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serves">Serves</Label>
            <Input
              id="serves"
              value={formData.serves}
              onChange={(e) => handleInputChange('serves', e.target.value)}
              placeholder="4 people"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Recipe description..."
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Nutritional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={formData.nutrients.calories}
                  onChange={(e) => handleNutrientChange('calories', e.target.value)}
                  placeholder="250"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbohydrateContent">Carbohydrates</Label>
                <Input
                  id="carbohydrateContent"
                  value={formData.nutrients.carbohydrateContent}
                  onChange={(e) => handleNutrientChange('carbohydrateContent', e.target.value)}
                  placeholder="30g"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proteinContent">Protein</Label>
                <Input
                  id="proteinContent"
                  value={formData.nutrients.proteinContent}
                  onChange={(e) => handleNutrientChange('proteinContent', e.target.value)}
                  placeholder="15g"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatContent">Fat</Label>
                <Input
                  id="fatContent"
                  value={formData.nutrients.fatContent}
                  onChange={(e) => handleNutrientChange('fatContent', e.target.value)}
                  placeholder="10g"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiberContent">Fiber</Label>
                <Input
                  id="fiberContent"
                  value={formData.nutrients.fiberContent}
                  onChange={(e) => handleNutrientChange('fiberContent', e.target.value)}
                  placeholder="5g"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sodiumContent">Sodium</Label>
                <Input
                  id="sodiumContent"
                  value={formData.nutrients.sodiumContent}
                  onChange={(e) => handleNutrientChange('sodiumContent', e.target.value)}
                  placeholder="300mg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Recipe' : 'Update Recipe'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};