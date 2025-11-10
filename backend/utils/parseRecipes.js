const fs = require('fs');
const path = require('path');

/**
 * Validates and parses numeric values, handling NaN and null cases
 * @param {*} value - The value to parse
 * @param {*} defaultValue - Default value if parsing fails (default: null)
 * @returns {number|null} - Parsed number or default value
 */
function parseNumericValue(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validates and cleans string values
 * @param {*} value - The value to clean
 * @param {*} defaultValue - Default value if cleaning fails (default: null)
 * @returns {string|null} - Cleaned string or default value
 */
function parseStringValue(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  if (typeof value !== 'string') {
    return String(value);
  }
  
  return value.trim();
}

/**
 * Validates and parses nutritional data from JSONB format
 * @param {Object} nutrients - Raw nutrients object
 * @returns {Object|null} - Cleaned nutrients object or null
 */
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
      // Handle numeric fields (calories)
      if (field === 'calories') {
        cleanedNutrients[field] = parseNumericValue(nutrients[field]);
      } else {
        // Handle string fields with units (e.g., "48 g", "78 mg")
        cleanedNutrients[field] = parseStringValue(nutrients[field]);
      }
    }
  });
  
  return Object.keys(cleanedNutrients).length > 0 ? cleanedNutrients : null;
}

/**
 * Validates and parses a single recipe object
 * @param {Object} recipe - Raw recipe data
 * @param {string|number} recipeId - Recipe identifier for error reporting
 * @returns {Object|null} - Cleaned recipe object or null if invalid
 */
function parseRecipe(recipe, recipeId) {
  try {
    if (!recipe || typeof recipe !== 'object') {
      console.warn(`Recipe ${recipeId}: Invalid recipe object`);
      return null;
    }
    
    // Required fields validation
    const title = parseStringValue(recipe.title);
    const cuisine = parseStringValue(recipe.cuisine);
    
    if (!title || !cuisine) {
      console.warn(`Recipe ${recipeId}: Missing required fields (title or cuisine)`);
      return null;
    }
    
    // Parse and validate all fields
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

/**
 * Parses and validates recipe data from JSON file
 * @param {string} filePath - Path to the JSON file containing recipe data
 * @returns {Promise<Array>} - Array of validated recipe objects
 */
async function parseRecipeData(filePath) {
  try {
    console.log(`Starting to parse recipe data from: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Recipe data file not found: ${filePath}`);
    }
    
    // Read and parse JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(fileContent);
    
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Invalid JSON structure: Expected object with recipe entries');
    }
    
    const recipes = [];
    const errors = [];
    let totalRecipes = 0;
    let validRecipes = 0;
    
    // Process each recipe in the JSON object
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

/**
 * Validates recipe data structure and provides statistics
 * @param {Array} recipes - Array of parsed recipes
 * @returns {Object} - Validation statistics
 */
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
    // Count recipes with ratings
    if (recipe.rating !== null && recipe.rating !== undefined) {
      stats.withRating++;
      stats.ratingSum += recipe.rating;
      stats.ratingCount++;
    }
    
    // Count recipes with nutritional data
    if (recipe.nutrients && Object.keys(recipe.nutrients).length > 0) {
      stats.withNutrients++;
    }
    
    // Count recipes with timing data
    if (recipe.total_time || recipe.prep_time || recipe.cook_time) {
      stats.withTimes++;
    }
    
    // Collect cuisine types
    if (recipe.cuisine) {
      stats.cuisineTypes.add(recipe.cuisine);
    }
  });
  
  // Calculate average rating
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