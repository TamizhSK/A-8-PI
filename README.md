# A-8-PI: Recipe Management Application

A full-stack recipe management application with PostgreSQL backend and React TypeScript frontend using shadcn/ui components.

## Features

- Recipe data parsing and storage in PostgreSQL
- RESTful API with pagination and search
- Modern React TypeScript frontend with shadcn/ui
- Recipe table with detailed view and filtering

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

4. **Seed data:**
   ```bash
   npm run seed
   ```

5. **Start server:**
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

- `GET /api/recipes` - Get recipes with pagination
- `GET /api/recipes/search` - Search recipes with filters
- `GET /health` - Health check

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.js
│   ├── config/db.js
│   ├── scripts/
│   └── utils/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── types/
│   └── public/
└── US_recipes_null.Pdf.json
```

## Tech Stack

**Backend:**
- Express.js
- PostgreSQL with pg
- CORS enabled

**Frontend:**
- React 19 with TypeScript
- Vite build tool
- shadcn/ui components
- Tailwind CSS
- Axios for API calls

## Development

Run both servers concurrently:

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Visit `http://localhost:5173` to use the application.