# Bike Rental Backend

Express.js backend server for the bike rental application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/bikes` - Get all bikes
- `POST /api/rentals` - Create rental
- `GET /api/rentals` - Get user rentals
- And more...





