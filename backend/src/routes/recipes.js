const express = require('express');
const recipesController = require('../controllers/recipesController');

const router = express.Router();

/**
 * Recipe Routes
 * Defines API endpoints for recipe operations
 */

// GET /api/recipes/search - Search recipes with filters
router.get('/search', recipesController.searchRecipes);

// GET /api/recipes - Get paginated recipes
router.get('/', recipesController.getRecipes);

module.exports = router;