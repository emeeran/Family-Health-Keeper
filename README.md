# Family Health Keeper

<div align="center">
  <h3>🏥 HIPAA-Compliant Family Medical Records Management</h3>
  <p>A comprehensive platform for managing family health records with AI-powered insights</p>
  
  [![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
</div>

## 📋 Overview

Family Health Keeper is a modern web application for managing family medical records, appointments, medications, and health insights. Built with a focus on privacy, security, and ease of use.

### Features

- 👨‍👩‍👧‍👦 **Family Member Management** - Track health records for multiple family members
- 📋 **Medical Records** - Comprehensive medical history and document management
- 💊 **Medication Tracking** - Manage medications, dosages, and reminders
- 📅 **Appointment Scheduling** - Schedule and manage doctor appointments
- 🤖 **AI-Powered Insights** - Health analysis using Google Gemini AI
- 🔐 **HIPAA Compliant** - Secure handling of medical data
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🌐 **PWA Support** - Install as a Progressive Web App, works offline
- 📊 **Health Reports** - Generate comprehensive health reports
- 💾 **Backup & Restore** - One-click encrypted backups (see [BACKUP_GUIDE.md](./BACKUP_GUIDE.md))

## 🚀 Deployment

### Netlify Deployment (Recommended)

This project is ready for one-click deployment to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/emeeran/Family-Health-Keeper)

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

## 🏗️ Architecture

This project follows a clean, production-ready architecture:

```
family-health-keeper/
├── backend/          # FastAPI Python backend
├── frontend/         # React TypeScript frontend
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── Makefile
└── README.md
```

### Technology Stack

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL with SQLAlchemy ORM
- Alembic for database migrations
- Redis for caching
- Google Generative AI for insights
- JWT authentication
- Docker support

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Zustand for state management
- Tailwind CSS for styling
- React Query for data fetching
- Docker support

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Family-Health-Keeper
   ```

2. **Set up environment variables:**
   ```bash
   cp backend_new/.env.example backend_new/.env
   cp frontend_new/.env.example frontend_new/.env.local
   # Edit the .env files with your configuration
   ```

3. **Start the services:**
   ```bash
   make docker-up
   ```

   Or manually:
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

1. **Setup the project:**
   ```bash
   make setup
   ```

2. **Start development servers:**
   ```bash
   make dev
   ```

   This will start both backend and frontend in development mode.

3. **Individual services:**
   ```bash
   # Backend only
   make dev-backend

   # Frontend only
   make dev-frontend
   ```

## 🛠️ Development

### Available Commands

```bash
# Setup
make setup              # Setup both frontend and backend
make setup-backend      # Setup backend dependencies
make setup-frontend     # Setup frontend dependencies

# Development
make dev                # Start both services in dev mode
make dev-backend        # Start backend in dev mode
make dev-frontend       # Start frontend in dev mode

# Testing
make test               # Run all tests
make test-backend       # Run backend tests
make test-frontend      # Run frontend tests

# Code Quality
make lint               # Lint all code
make format             # Format all code

# Build
make build              # Build both frontend and backend
make build-backend      # Build backend
make build-frontend     # Build frontend

# Docker
make docker-build       # Build Docker images
make docker-up          # Start Docker services
make docker-down        # Stop Docker services
make docker-clean       # Clean Docker resources

# Cleanup
make clean              # Clean build artifacts
```

### Environment Configuration

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/family_health_keeper
SECRET_KEY=your-super-secret-key
GOOGLE_API_KEY=your-google-api-key
REDIS_URL=redis://localhost:6379/0
```

**Frontend (.env.local):**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_ENABLE_AI_FEATURES=true
```

## 📁 Project Structure

### Backend (`/backend_new`)

```
app/
├── api/           # API routes and endpoints
├── core/          # Core functionality (security, config)
├── db/            # Database configuration and sessions
├── models/        # SQLAlchemy database models
├── schemas/       # Pydantic schemas
├── crud/          # CRUD operations
├── services/      # Business logic
├── middleware/    # Custom middleware
└── utils/         # Utility functions

alembic/           # Database migrations
tests/             # Backend tests
uploads/           # File uploads
scripts/           # Utility scripts
```

### Frontend (`/frontend_new/src`)

```
components/
├── common/        # Reusable UI components
├── layout/        # Layout components
└── features/      # Feature-specific components
    ├── auth/      # Authentication
    ├── family/    # Family management
    ├── health/    # Health records
    ├── medications/
    ├── appointments/
    ├── documents/
    └── ai/        # AI features

pages/             # Page components
hooks/             # Custom React hooks
api/               # API client layer
store/             # State management
routes/            # Routing configuration
utils/             # Utility functions
types/             # TypeScript type definitions
styles/            # Global styles
```

## 🔒 Security

This application is designed with security in mind:

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **HIPAA Compliance** - Follows HIPAA guidelines for medical data
- 🔒 **Encryption** - Data encryption at rest and in transit
- 🚫 **Input Validation** - Comprehensive input validation and sanitization
- 📊 **Audit Logging** - Complete audit trail for all operations
- 🌐 **CORS Protection** - Proper CORS configuration
- 🚦 **Rate Limiting** - API rate limiting to prevent abuse

## 🧪 Testing

### Backend Tests
```bash
cd backend_new
pytest
```

### Frontend Tests
```bash
cd frontend_new
npm test
```

### Test Coverage
```bash
# Backend
make test-backend

# Frontend
make test-frontend
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses automated code formatting:

- **Backend**: Black, isort, flake8
- **Frontend**: Prettier, ESLint

Run `make format` to format all code automatically.

## 📄 License

This project is UNLICENSED - All rights reserved.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the configuration examples

---

<div align="center">
  <p>Made with ❤️ for families who care about their health</p>
</div>