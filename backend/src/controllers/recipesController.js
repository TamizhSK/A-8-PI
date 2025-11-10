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
      query += ` ORDER BY rating DESC NULLS LAST, title ASC`;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        data: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('Error searching recipes:', error);
      
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      if (error.code === '22P02') { // Invalid input syntax
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

  async getRecipes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      
      if (page < 1) {
        return res.status(400).json({
          error: 'Invalid page number',
          message: 'Page number must be greater than 0'
        });
      }
      if (limit < 15 || limit > 50) {
        return res.status(400).json({
          error: 'Invalid page limit',
          message: 'Page limit must be between 15 and 50'
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
        ORDER BY id ASC 
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
      
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Database connection failed',
          message: 'Unable to connect to the database. Please try again later.'
        });
      }
      
      if (error.code === '22P02') { // Invalid input syntax
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
}

module.exports = new RecipesController();