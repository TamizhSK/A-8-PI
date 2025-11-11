# A-8-PI: Recipe Management Application

A full-stack recipe management application with PostgreSQL backend and React TypeScript frontend using shadcn/ui components.

## Features

- Recipe data parsing and storage in PostgreSQL
- Complete CRUD operations (Create, Read, Update, Delete)
- RESTful API with pagination and advanced search
- Modern React TypeScript frontend with shadcn/ui
- Recipe table with detailed view and filtering
- Recipe creation and editing forms
- Delete confirmation dialogs
- Nutritional information management
- Dynamic cuisine loading from database

## Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL 12+
- npm

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   Create `backend/.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=recipe
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=5001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

3. **Setup database:**
   ```sql
   CREATE DATABASE recipe;
   ```

4. **Create database schema:**
   ```bash
   psql -d recipe -f scripts/schema.sql
   ```

5. **Seed data:**
   ```bash
   npm run seed
   ```

6. **Start server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5001`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   Create `frontend/.env`:
   ```
   VITE_API_BASE_URL=http://localhost:5001/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## API Endpoints

### Recipe Management
- `GET /api/recipes` - Get recipes with pagination
- `GET /api/recipes/:id` - Get single recipe by ID
- `GET /api/recipes/cuisines/list` - Get list of available cuisines
- `GET /api/recipes/search` - Search recipes with filters
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update existing recipe
- `DELETE /api/recipes/:id` - Delete recipe

### System
- `GET /health` - Health check

## API Testing with cURL

### 1. Health Check
```bash
curl -X GET http://localhost:5001/health
```

### 2. Get Recipes (with pagination)
```bash
# Get first page (default 10 recipes per page)
curl -X GET "http://localhost:5001/api/recipes?page=1"

# Get first page with 5 recipes
curl -X GET "http://localhost:5001/api/recipes?page=1&limit=5"

# Get second page with 10 recipes
curl -X GET "http://localhost:5001/api/recipes?page=2&limit=10"

# Get larger page (up to 100 recipes)
curl -X GET "http://localhost:5001/api/recipes?page=1&limit=25"
```

### 3. Get Single Recipe
```bash
# Replace {id} with actual recipe ID
curl -X GET http://localhost:5001/api/recipes/1
```

### 4. Get Available Cuisines
```bash
curl -X GET http://localhost:5001/api/recipes/cuisines/list
```

### 5. Search Recipes
```bash
# Search by title
curl -X GET "http://localhost:5001/api/recipes/search?title=chicken"

# Search by cuisine (use actual cuisine from database)
curl -X GET "http://localhost:5001/api/recipes/search?cuisine=Southern%20Recipes"

# Search by rating (exact match)
curl -X GET "http://localhost:5001/api/recipes/search?rating=4.5"

# Search by rating (greater than or equal)
curl -X GET "http://localhost:5001/api/recipes/search?rating=>=4.0"

# Search by total time (less than 30 minutes)
curl -X GET "http://localhost:5001/api/recipes/search?total_time=<30"

# Search by calories (greater than 300)
curl -X GET "http://localhost:5001/api/recipes/search?calories=>300"

# Combined search
curl -X GET "http://localhost:5001/api/recipes/search?cuisine=Southern%20Recipes&rating=>=4.0&total_time=<60"
```

### 6. Create New Recipe
```bash
curl -X POST http://localhost:5001/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "cuisine": "Southern Recipes",
    "title": "My Special Jambalaya",
    "rating": 4.8,
    "prep_time": 10,
    "cook_time": 15,
    "total_time": 25,
    "description": "A delicious Southern-style jambalaya recipe",
    "serves": "4 people",
    "nutrients": {
      "calories": 520,
      "carbohydrateContent": "45g",
      "proteinContent": "22g",
      "fatContent": "28g"
    }
  }'
```

### 7. Update Recipe
```bash
# Replace {id} with actual recipe ID
curl -X PUT http://localhost:5001/api/recipes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5.0,
    "description": "Updated description for this amazing recipe"
  }'
```

### 8. Delete Recipe
```bash
# Replace {id} with actual recipe ID
curl -X DELETE http://localhost:5001/api/recipes/1
```

## Search Operators

The search API supports various operators for numeric fields (rating, total_time, calories):

- `=` or no operator - Exact match (default)
- `>` - Greater than
- `<` - Less than  
- `>=` - Greater than or equal
- `<=` - Less than or equal

**Examples:**
- `rating=4.5` - Recipes with exactly 4.5 rating
- `rating=>=4.0` - Recipes with 4.0 or higher rating
- `total_time=<30` - Recipes taking less than 30 minutes
- `calories=>500` - Recipes with more than 500 calories

## Response Formats

### Paginated Response (GET /api/recipes)
```json
{
  "page": 1,
  "limit": 10,
  "total": 150,
  "totalPages": 15,
  "data": [...]
}
```

### Search Response (GET /api/recipes/search)
```json
{
  "data": [...],
  "count": 25
}
```

### Single Recipe Response
```json
{
  "data": {
    "id": 24736,
    "cuisine": "Southern Recipes",
    "title": "Best Jambalaya",
    "rating": 4.8,
    "prep_time": 10,
    "cook_time": 15,
    "total_time": 25,
    "description": "Authentic Southern jambalaya recipe",
    "serves": "4 people",
    "nutrients": {
      "calories": 520,
      "carbohydrateContent": "45g",
      "proteinContent": "22g"
    },
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "error": "Recipe not found",
  "message": "No recipe found with id 999"
}
```

## Testing

### Run API Tests
```bash
cd backend
npm run test-api
```

### Run Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── recipesController.js
│   │   ├── routes/
│   │   │   └── recipes.js
│   │   └── server.js
│   ├── config/
│   │   └── db.js
│   ├── scripts/
│   │   ├── schema.sql
│   │   └── seedDatabase.js
│   ├── utils/
│   │   └── parseRecipes.js
│   └── test-api.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── RecipeTable.tsx
│   │   │   ├── RecipeDrawer.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── api/
│   │   │   └── recipeApi.ts
│   │   └── types/
│   │       └── recipe.ts
│   └── public/
└── US_recipes_null.Pdf.json
```

## Tech Stack

**Backend:**
- Express.js
- PostgreSQL with pg
- CORS enabled
- Native Node.js modules

**Frontend:**
- React 19 with TypeScript
- Vite build tool
- shadcn/ui components
- Tailwind CSS
- Native Fetch API for HTTP requests

## Development

Run both servers concurrently:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Visit `http://localhost:5173` to use the application.

## Database Schema

The recipes table includes:
- `id` - Primary key (auto-increment)
- `cuisine` - Recipe cuisine type
- `title` - Recipe name
- `rating` - Recipe rating (0-5)
- `prep_time` - Preparation time in minutes
- `cook_time` - Cooking time in minutes  
- `total_time` - Total time in minutes
- `description` - Recipe description
- `nutrients` - JSONB field for nutritional information
- `serves` - Number of servings
- `created_at` - Timestamp

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the provided curl commands
5. Submit a pull request