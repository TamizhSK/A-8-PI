import React, { useState } from 'react';
import type { Recipe, NutritionalData } from '@/types/recipe';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Clock, Users, Trash2, Edit } from 'lucide-react';
import { DataField, TimeField, NutrientField } from './DataField';

interface RecipeDrawerProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (recipeId: number) => Promise<void>;
  onEdit?: (recipe: Recipe) => void;
  deleting?: boolean;
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



const TimeBreakdown: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto font-normal"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Time Breakdown</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <TimeField label="Prep Time" minutes={recipe.prep_time} />
          <TimeField label="Cook Time" minutes={recipe.cook_time} />
          <div className="col-span-2">
            <TimeField label="Total Time" minutes={recipe.total_time} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const NutritionalTable: React.FC<{ nutrients?: NutritionalData }> = ({ nutrients }) => {
  if (!nutrients) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-2xl mb-2">📊</div>
        <div className="text-sm">No nutritional information available</div>
      </div>
    );
  }

  const nutritionItems = [
    { label: 'Calories', value: nutrients.calories },
    { label: 'Carbohydrates', value: nutrients.carbohydrateContent },
    { label: 'Protein', value: nutrients.proteinContent },
    { label: 'Total Fat', value: nutrients.fatContent },
    { label: 'Saturated Fat', value: nutrients.saturatedFatContent },
    { label: 'Fiber', value: nutrients.fiberContent },
    { label: 'Sodium', value: nutrients.sodiumContent },
    { label: 'Sugar', value: nutrients.sugarContent },
    { label: 'Cholesterol', value: nutrients.cholesterolContent },
  ];

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Nutritional Information</h4>
      <div className="grid grid-cols-1 gap-2">
        {nutritionItems.map((item) => (
          <div
            key={item.label}
            className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <NutrientField 
              label=""
              value={item.value}
              className="text-sm text-muted-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecipeDrawer: React.FC<RecipeDrawerProps> = ({
  recipe,
  open,
  onOpenChange,
  onDelete,
  onEdit,
  deleting = false,
}) => {
  if (!recipe) return null;

  const handleDelete = async () => {
    if (onDelete && recipe.id) {
      await onDelete(recipe.id);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-left text-xl flex-1">
              {recipe.title}
            </SheetTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                  disabled={deleting}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="capitalize bg-secondary px-2 py-1 rounded-md">
              {recipe.cuisine || 'N/A'}
            </span>
            <StarRating rating={recipe.rating} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <DataField 
              value={recipe.description}
              fallback="No description available"
              className="text-sm text-muted-foreground leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <DataField 
              label="Serves"
              value={recipe.serves}
              inline
              className="font-medium"
            />
          </div>
          <div className="border rounded-lg p-4">
            <TimeBreakdown recipe={recipe} />
          </div>
          <div className="border rounded-lg p-4">
            <NutritionalTable nutrients={recipe.nutrients} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};