const { pool } = require('../../config/db');

class RecipesController {
  static parseOperator(value) {
    if (!value) return null;
    const stringValue = String(value);
    if (stringValue.startsWith('>=')) {
      return { operator: '>=', value: parseFloat(stringValue.slice(2)) };
    }
    if (stringValue.startsWith('<=')) {
      return { operator: '<=', value: parseFloat(stringValue.slice(2)) };
    }
    if (stringValue.startsWith('>')) {
      return { operator: '>', value: parseFloat(stringValue.slice(1)) };
    }
    if (stringValue.startsWith('<')) {
      return { operator: '<', value: parseFloat(stringValue.slice(1)) };
    }
    if (stringValue.startsWith('=')) {
      return { operator: '=', value: parseFloat(stringValue.slice(1)) };
    }
    const numValue = parseFloat(stringValue);
    return isNaN(numValue) ? null : { operator: '=', value: numValue };
  }

  async getRecipes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      if (page < 1) {
        return res.status(400).json({
          error: 'Invalid page number',
          message: 'Page number must be greater than 0'
        });
      }
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'Invalid page limit',
          message: 'Page limit must be between 1 and 100'
        });
      }
      const offset = (page - 1) * limit;
      const countQuery = 'SELECT COUNT(*) as total FROM recipes';
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      if (page > totalPages && total > 0) {
        return res.status(400).json({
          error: 'Page not found',
          message: `Page ${page} exceeds total pages (${totalPages})`
        });
      }
      const recipesQuery = `
        SELECT id,cuisine,title,rating,prep_time,cook_time,total_time,description,nutrients,serves,created_at
        FROM recipes 
        ORDER BY title ASC 
        LIMIT $1 OFFSET $2
      `;
      const recipesResult = await pool.query(recipesQuery, [limit, offset]);
      res.status(200).json({
        page,
        limit,
        total,
        totalPages,
        data: recipesResult.rows
      });
      
    } catch (error) {
      console.error('Error fetching recipes:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      if (error.code === '22P02') { 
        return res.status(400).json({
          error: 'Invalid pagination parameters',
          message: 'Please check your page and limit values.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to fetch recipes',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async getCuisines(req, res) {
    try {
      const query = `
        SELECT DISTINCT cuisine 
        FROM recipes 
        WHERE cuisine IS NOT NULL AND cuisine != ''
        ORDER BY cuisine ASC
      `;
      
      const result = await pool.query(query);
      const cuisines = result.rows.map(row => row.cuisine);
      
      res.status(200).json({
        data: cuisines,
        count: cuisines.length
      });
    } catch (error) {
      console.error('Error fetching cuisines:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to fetch cuisines',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid recipe ID',
          message: 'Recipe ID must be a valid number'
        });
      }

      const query = `
        SELECT id, cuisine, title, rating, prep_time, cook_time, total_time, 
               description, nutrients, serves, created_at
        FROM recipes 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Recipe not found',
          message: `No recipe found with id ${id}`
        });
      }
      
      res.status(200).json({
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching recipe:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to fetch recipe',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async searchRecipes(req, res) {
    try {
      const {
        title,
        cuisine,
        rating,
        total_time,
        calories
      } = req.query;
      let query = `
        SELECT id, cuisine,title,rating,prep_time,cook_time,total_time,description,nutrients,serves,created_at
        FROM recipes 
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramIndex = 1;
      if (title && title.trim()) {
        query += ` AND title ILIKE $${paramIndex}`;
        queryParams.push(`%${title.trim()}%`);
        paramIndex++;
      }

      if (cuisine && cuisine.trim()) {
        query += ` AND cuisine = $${paramIndex}`;
        queryParams.push(cuisine.trim());
        paramIndex++;
      }

      if (rating) {
        const ratingFilter = RecipesController.parseOperator(rating);
        if (ratingFilter && !isNaN(ratingFilter.value)) {
          query += ` AND rating ${ratingFilter.operator} $${paramIndex}`;
          queryParams.push(ratingFilter.value);
          paramIndex++;
        }
      }

      if (total_time) {
        const timeFilter = RecipesController.parseOperator(total_time);
        if (timeFilter && !isNaN(timeFilter.value)) {
          query += ` AND total_time ${timeFilter.operator} $${paramIndex}`;
          queryParams.push(timeFilter.value);
          paramIndex++;
        }
      }
      if (calories) {
        const caloriesFilter = RecipesController.parseOperator(calories);
        if (caloriesFilter && !isNaN(caloriesFilter.value)) {
          query += ` AND (nutrients->>'calories')::numeric ${caloriesFilter.operator} $${paramIndex}`;
          queryParams.push(caloriesFilter.value);
          paramIndex++;
        }
      }
      query += ` ORDER BY title ASC`;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error searching recipes:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      if (error.code === '22P02') { 
        return res.status(400).json({
          error: 'Invalid search parameters',
          message: 'Please check your search criteria and try again.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to search recipes',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async createRecipe(req, res) {
    try {
      const {
        cuisine,
        title,
        rating,
        prep_time,
        cook_time,
        total_time,
        description,
        nutrients,
        serves
      } = req.body;

      // Validate required fields
      if (!cuisine || !title) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Cuisine and title are required'
        });
      }

      // Validate data types
      if (rating !== undefined && (isNaN(rating) || rating < 0 || rating > 5)) {
        return res.status(400).json({
          error: 'Invalid rating',
          message: 'Rating must be a number between 0 and 5'
        });
      }

      if (prep_time !== undefined && (isNaN(prep_time) || prep_time < 0)) {
        return res.status(400).json({
          error: 'Invalid prep time',
          message: 'Prep time must be a positive number'
        });
      }

      if (cook_time !== undefined && (isNaN(cook_time) || cook_time < 0)) {
        return res.status(400).json({
          error: 'Invalid cook time',
          message: 'Cook time must be a positive number'
        });
      }

      if (total_time !== undefined && (isNaN(total_time) || total_time < 0)) {
        return res.status(400).json({
          error: 'Invalid total time',
          message: 'Total time must be a positive number'
        });
      }

      const query = `
        INSERT INTO recipes (
          cuisine, title, rating, prep_time, cook_time, 
          total_time, description, nutrients, serves
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, cuisine, title, rating, prep_time, cook_time, 
                  total_time, description, nutrients, serves, created_at
      `;

      const values = [
        cuisine,
        title,
        rating || null,
        prep_time || null,
        cook_time || null,
        total_time || null,
        description || null,
        nutrients ? JSON.stringify(nutrients) : null,
        serves || null
      ];

      const result = await pool.query(query, values);
      
      res.status(201).json({
        message: 'Recipe created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating recipe:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: 'Recipe already exists',
          message: 'A recipe with this title and cuisine already exists'
        });
      }
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create recipe',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async updateRecipe(req, res) {
    try {
      const { id } = req.params;
      const {
        cuisine,
        title,
        rating,
        prep_time,
        cook_time,
        total_time,
        description,
        nutrients,
        serves
      } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid recipe ID',
          message: 'Recipe ID must be a valid number'
        });
      }

      // Check if recipe exists
      const checkQuery = 'SELECT id FROM recipes WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          error: 'Recipe not found',
          message: `No recipe found with id ${id}`
        });
      }

      // Validate data types if provided
      if (rating !== undefined && (isNaN(rating) || rating < 0 || rating > 5)) {
        return res.status(400).json({
          error: 'Invalid rating',
          message: 'Rating must be a number between 0 and 5'
        });
      }

      if (prep_time !== undefined && (isNaN(prep_time) || prep_time < 0)) {
        return res.status(400).json({
          error: 'Invalid prep time',
          message: 'Prep time must be a positive number'
        });
      }

      if (cook_time !== undefined && (isNaN(cook_time) || cook_time < 0)) {
        return res.status(400).json({
          error: 'Invalid cook time',
          message: 'Cook time must be a positive number'
        });
      }

      if (total_time !== undefined && (isNaN(total_time) || total_time < 0)) {
        return res.status(400).json({
          error: 'Invalid total time',
          message: 'Total time must be a positive number'
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (cuisine !== undefined) {
        updateFields.push(`cuisine = $${paramIndex}`);
        values.push(cuisine);
        paramIndex++;
      }

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        values.push(title);
        paramIndex++;
      }

      if (rating !== undefined) {
        updateFields.push(`rating = $${paramIndex}`);
        values.push(rating);
        paramIndex++;
      }

      if (prep_time !== undefined) {
        updateFields.push(`prep_time = $${paramIndex}`);
        values.push(prep_time);
        paramIndex++;
      }

      if (cook_time !== undefined) {
        updateFields.push(`cook_time = $${paramIndex}`);
        values.push(cook_time);
        paramIndex++;
      }

      if (total_time !== undefined) {
        updateFields.push(`total_time = $${paramIndex}`);
        values.push(total_time);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(description);
        paramIndex++;
      }

      if (nutrients !== undefined) {
        updateFields.push(`nutrients = $${paramIndex}`);
        values.push(nutrients ? JSON.stringify(nutrients) : null);
        paramIndex++;
      }

      if (serves !== undefined) {
        updateFields.push(`serves = $${paramIndex}`);
        values.push(serves);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No fields to update',
          message: 'At least one field must be provided for update'
        });
      }

      values.push(id);
      const query = `
        UPDATE recipes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, cuisine, title, rating, prep_time, cook_time, 
                  total_time, description, nutrients, serves, created_at
      `;

      const result = await pool.query(query, values);
      
      res.status(200).json({
        message: 'Recipe updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Recipe already exists',
          message: 'A recipe with this title and cuisine already exists'
        });
      }
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to update recipe',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async deleteRecipe(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: 'Invalid recipe ID',
          message: 'Recipe ID must be a valid number'
        });
      }

      const checkQuery = 'SELECT id, title FROM recipes WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rowCount === 0) {
        return res.status(404).json({
          error: 'Recipe not found',
          message: `No recipe found with id ${id}`
        });
      }
      
      const deleteQuery = 'DELETE FROM recipes WHERE id = $1 RETURNING id, title';
      const deleteResult = await pool.query(deleteQuery, [id]);
      
      res.status(200).json({
        message: 'Recipe deleted successfully',
        data: {
          id: deleteResult.rows[0].id,
          title: deleteResult.rows[0].title
        }
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to delete recipe',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new RecipesController();