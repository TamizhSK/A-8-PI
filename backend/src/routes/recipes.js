const express = require('express');
const recipesController = require('../controllers/recipesController');

const router = express.Router();

router.get('/search', recipesController.searchRecipes);

router.get('/', recipesController.getRecipes);

router.delete('/:id', recipesController.deleteRecipe);

module.exports = router;