const path = require('path');
const { pool } = require('../config/db');
const { parseRecipeData, validateRecipeData } = require('../utils/parseRecipes');

async function batchInsertRecipes(recipes, batchSize = 100) {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    console.log('No recipes to insert');
    return 0;
  }
  
  let insertedCount = 0;
  const totalBatches = Math.ceil(recipes.length / batchSize);
  
  console.log(`Starting batch insertion: ${recipes.length} recipes in ${totalBatches} batches`);
  
  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    try {
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} recipes)...`);
      const values = [];
      const params = [];
      let paramIndex = 1;
      
      batch.forEach(recipe => {
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`);
        
        params.push(
          recipe.cuisine,
          recipe.title,
          recipe.rating,
          recipe.prep_time,
          recipe.cook_time,
          recipe.total_time,
          recipe.description,
          recipe.nutrients ? JSON.stringify(recipe.nutrients) : null,
          recipe.serves
        );
        
        paramIndex += 9;
      });
      
      const insertQuery = `
        INSERT INTO recipes (
          cuisine, title, rating, prep_time, cook_time, 
          total_time, description, nutrients, serves
        ) VALUES ${values.join(', ')}
        ON CONFLICT (title, cuisine) DO NOTHING
        RETURNING id;
      `;
      
      const result = await pool.query(insertQuery, params);
      const batchInsertedCount = result.rowCount;
      insertedCount += batchInsertedCount;
      
      console.log(`Batch ${batchNumber} completed: ${batchInsertedCount} recipes inserted`);
      
    } catch (error) {
      console.error(`Error in batch ${batchNumber}:`, error.message);
      console.log(`Attempting individual inserts for batch ${batchNumber}...`);
      
      for (const recipe of batch) {
        try {
          const individualQuery = `
            INSERT INTO recipes (
              cuisine, title, rating, prep_time, cook_time, 
              total_time, description, nutrients, serves
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (title, cuisine) DO NOTHING
            RETURNING id;
          `;
          
          const individualParams = [
            recipe.cuisine,
            recipe.title,
            recipe.rating,
            recipe.prep_time,
            recipe.cook_time,
            recipe.total_time,
            recipe.description,
            recipe.nutrients ? JSON.stringify(recipe.nutrients) : null,
            recipe.serves
          ];
          
          const individualResult = await pool.query(individualQuery, individualParams);
          if (individualResult.rowCount > 0) {
            insertedCount++;
          }
          
        } catch (individualError) {
          console.error(`Failed to insert recipe "${recipe.title}":`, individualError.message);
        }
      }
    }
  }
  
  return insertedCount;
}
async function clearRecipeData() {
  try {
    console.log('Clearing existing recipe data...');
    const result = await pool.query('DELETE FROM recipes');
    console.log(`Cleared ${result.rowCount} existing recipes`);
    return result.rowCount;
  } catch (error) {
    console.error('Error clearing recipe data:', error.message);
    throw error;
  }
}

async function verifySchema() {
  try {
    console.log('Verifying database schema...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Recipes table does not exist. Please run the schema.sql script first.');
      throw new Error('Database schema not found. Run schema.sql to create tables.');
    }
    
    console.log('Database schema verified successfully');
    
  } catch (error) {
    console.error('Schema verification failed:', error.message);
    throw error;
  }
}

async function getDatabaseStats() {
  try {
    const stats = {};
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM recipes');
    stats.totalRecipes = parseInt(totalResult.rows[0].total);
    const ratingResult = await pool.query('SELECT COUNT(*) as count FROM recipes WHERE rating IS NOT NULL');
    stats.recipesWithRating = parseInt(ratingResult.rows[0].count);
    const nutrientsResult = await pool.query('SELECT COUNT(*) as count FROM recipes WHERE nutrients IS NOT NULL');
    stats.recipesWithNutrients = parseInt(nutrientsResult.rows[0].count);
    const avgRatingResult = await pool.query('SELECT AVG(rating) as avg_rating FROM recipes WHERE rating IS NOT NULL');
    stats.averageRating = avgRatingResult.rows[0].avg_rating ? parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(2) : null;
    const cuisineResult = await pool.query('SELECT DISTINCT cuisine FROM recipes ORDER BY cuisine');
    stats.cuisineTypes = cuisineResult.rows.map(row => row.cuisine);
    
    return stats;
    
  } catch (error) {
    console.error('Error getting database statistics:', error.message);
    return {};
  }
}

async function seedDatabase(options = {}) {
  const {
    dataFile = path.join(__dirname, '../../US_recipes_null.Pdf.json'),
    clearExisting = true,
    batchSize = 100
  } = options;
  
  const startTime = Date.now();
  
  try {
    console.log('=== Recipe Database Seeding Started ===');
    console.log(`Data file: ${dataFile}`);
    console.log(`Clear existing: ${clearExisting}`);
    console.log(`Batch size: ${batchSize}`);
    console.log('');

    await verifySchema();
    
    if (clearExisting) {
      await clearRecipeData();
    }
    
    console.log('Parsing recipe data...');
    const recipes = await parseRecipeData(dataFile);
    
    if (recipes.length === 0) {
      console.log('No valid recipes found to seed');
      return;
    }

    console.log('Validating parsed data...');
    const validationStats = validateRecipeData(recipes);
    console.log('Validation statistics:', validationStats);
    console.log('');

    console.log('Inserting recipes into database...');
    const insertedCount = await batchInsertRecipes(recipes, batchSize);

    console.log('Getting database statistics...');
    const dbStats = await getDatabaseStats();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('=== Seeding Completed Successfully ===');
    console.log(`Duration: ${duration} seconds`);
    console.log(`Recipes processed: ${recipes.length}`);
    console.log(`Recipes inserted: ${insertedCount}`);
    console.log(`Total recipes in database: ${dbStats.totalRecipes}`);
    console.log(`Recipes with ratings: ${dbStats.recipesWithRating}`);
    console.log(`Recipes with nutrients: ${dbStats.recipesWithNutrients}`);
    console.log(`Average rating: ${dbStats.averageRating || 'N/A'}`);
    console.log(`Cuisine types: ${dbStats.cuisineTypes ? dbStats.cuisineTypes.length : 0}`);
    
    if (dbStats.cuisineTypes && dbStats.cuisineTypes.length <= 10) {
      console.log(`Cuisines: ${dbStats.cuisineTypes.join(', ')}`);
    }
    
  } catch (error) {
    console.error('');
    console.error('=== Seeding Failed ===');
    console.error('Error:', error.message);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  batchInsertRecipes,
  clearRecipeData,
  verifySchema,
  getDatabaseStats
};