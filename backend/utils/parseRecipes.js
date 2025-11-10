const fs = require('fs'); 

function parseNumericValue(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringValue(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value !== 'string') {
    return String(value);
  }
  
  return value.trim();
}


function parseNutrients(nutrients) {
  if (!nutrients || typeof nutrients !== 'object') {
    return null;
  }
  
  const cleanedNutrients = {};
  const nutrientFields = [
    'calories',
    'carbohydrateContent',
    'cholesterolContent',
    'fiberContent',
    'proteinContent',
    'saturatedFatContent',
    'sodiumContent',
    'sugarContent',
    'fatContent',
    'unsaturatedFatContent'
  ];
  
  nutrientFields.forEach(field => {
    if (nutrients[field] !== undefined && nutrients[field] !== null) {

      if (field === 'calories') {
        cleanedNutrients[field] = parseNumericValue(nutrients[field]);
      } else {

        cleanedNutrients[field] = parseStringValue(nutrients[field]);
      }
    }
  });
  
  return Object.keys(cleanedNutrients).length > 0 ? cleanedNutrients : null;
}


function parseRecipe(recipe, recipeId) {
  try {
    if (!recipe || typeof recipe !== 'object') {
      console.warn(`Recipe ${recipeId}: Invalid recipe object`);
      return null;
    }
    
    const title = parseStringValue(recipe.title);
    const cuisine = parseStringValue(recipe.cuisine);
    
    if (!title || !cuisine) {
      console.warn(`Recipe ${recipeId}: Missing required fields (title or cuisine)`);
      return null;
    }
    
    const parsedRecipe = {
      cuisine: cuisine,
      title: title,
      rating: parseNumericValue(recipe.rating),
      prep_time: parseNumericValue(recipe.prep_time),
      cook_time: parseNumericValue(recipe.cook_time),
      total_time: parseNumericValue(recipe.total_time),
      description: parseStringValue(recipe.description),
      nutrients: parseNutrients(recipe.nutrients),
      serves: parseStringValue(recipe.serves)
    };
    
    return parsedRecipe;
  } catch (error) {
    console.error(`Recipe ${recipeId}: Error parsing recipe -`, error.message);
    return null;
  }
}


async function parseRecipeData(filePath) {
  try {
    console.log(`Starting to parse recipe data from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Recipe data file not found: ${filePath}`);
    }
    
  
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(fileContent);
    
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Invalid JSON structure: Expected object with recipe entries');
    }
    
    const recipes = [];
    const errors = [];
    let totalRecipes = 0;
    let validRecipes = 0;
    

    for (const [key, recipeData] of Object.entries(rawData)) {
      totalRecipes++;
      
      const parsedRecipe = parseRecipe(recipeData, key);
      
      if (parsedRecipe) {
        recipes.push(parsedRecipe);
        validRecipes++;
      } else {
        errors.push(`Recipe ${key}: Failed validation`);
      }
    }
    
    console.log(`Recipe parsing completed:`);
    console.log(`- Total recipes processed: ${totalRecipes}`);
    console.log(`- Valid recipes: ${validRecipes}`);
    console.log(`- Invalid recipes: ${totalRecipes - validRecipes}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('Sample errors:', errors.slice(0, 10));
    } else if (errors.length > 10) {
      console.log(`${errors.length} recipes failed validation (showing first 10):`, errors.slice(0, 10));
    }
    
    return recipes;
    
  } catch (error) {
    console.error('Error parsing recipe data:', error.message);
    throw error;
  }
}

function validateRecipeData(recipes) {
  if (!Array.isArray(recipes)) {
    throw new Error('Expected array of recipes');
  }
  
  const stats = {
    total: recipes.length,
    withRating: 0,
    withNutrients: 0,
    withTimes: 0,
    cuisineTypes: new Set(),
    avgRating: 0,
    ratingSum: 0,
    ratingCount: 0
  };
  
  recipes.forEach(recipe => {

    if (recipe.rating !== null && recipe.rating !== undefined) {
      stats.withRating++;
      stats.ratingSum += recipe.rating;
      stats.ratingCount++;
    }
    if (recipe.nutrients && Object.keys(recipe.nutrients).length > 0) {
      stats.withNutrients++;
    }
    if (recipe.total_time || recipe.prep_time || recipe.cook_time) {
      stats.withTimes++;
    }
    if (recipe.cuisine) {
      stats.cuisineTypes.add(recipe.cuisine);
    }
  });

  if (stats.ratingCount > 0) {
    stats.avgRating = (stats.ratingSum / stats.ratingCount).toFixed(2);
  }
  stats.cuisineTypes = Array.from(stats.cuisineTypes);
  return stats;
}

module.exports = {
  parseRecipeData,
  parseRecipe,
  parseNumericValue,
  parseStringValue,
  parseNutrients,
  validateRecipeData
};