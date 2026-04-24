# King Kebab 🥙

King Kebab is a modern food delivery platform built with Next.js frontend and Node.js backend.

## Technologies 🛠

### Frontend

- Next.js (TypeScript)
- Shadcn UI components
- Environment variables (.env.local)
- ESLint configuration
- PostCSS

### Backend

- Node.js
- Express.js
- MongoDB (with models)
- Docker support
- Environment variables (.env)

## Getting Started 🚀

### Running Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend development server will run on http://localhost:3000

### Running Backend

```bash
cd backend
npm install
npm start
```

Backend server will run on http://localhost:5000

## Docker Deployment 🐳

To run the backend in a Docker container:

```bash
cd backend
docker build -t king-kebab-backend .
docker run -p 5000:5000 king-kebab-backend
```

## Project Structure 📁

```
king-kebab/
├── frontend/           # Next.js frontend application
│   ├── src/           # Source code
│   ├── public/        # Static files
│   └── .env.local     # Frontend environment variables
│
└── backend/           # Node.js backend server
    ├── routes/        # API routes
    ├── models/        # Database models
    ├── middleware/    # Middleware functions
    └── .env          # Backend environment variables
```

## Environment Variables 🔐

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## License 📝

MIT

## Author 👨‍��

King Kebab Team
