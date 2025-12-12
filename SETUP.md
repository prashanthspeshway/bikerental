# Setup Instructions

## Environment Configuration

### Backend Environment

The `backend/.env` file has been created with the MongoDB credentials. If you need to recreate it, copy from `backend/.env.example`:

```env
PORT=3000
FRONTEND_URL=http://localhost:8080
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
MONGODB_URI=mongodb+srv://bikerental:saranya@cluster0.602qj8l.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=bikerental
```

### Frontend Environment

The `frontend/.env` file has been created. If you need to recreate it, copy from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install separately:
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Seed Database (Optional)

To populate the database with default bikes:

```bash
cd backend
npm run seed
```

## Run the Application

```bash
# Run both backend and frontend
npm run dev

# Or run separately:
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Access

- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/api

