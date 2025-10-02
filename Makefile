.PHONY: help build dev dev-backend dev-frontend test test-backend test-frontend clean lint lint-backend lint-frontend format setup setup-backend setup-frontend docker-build docker-up docker-down docker-clean

# Default target
help:
	@echo "Family Health Keeper - Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  setup          - Setup both frontend and backend"
	@echo "  setup-backend  - Setup backend dependencies"
	@echo "  setup-frontend - Setup frontend dependencies"
	@echo ""
	@echo "Development:"
	@echo "  dev            - Start both frontend and backend in development mode"
	@echo "  dev-backend    - Start backend in development mode"
	@echo "  dev-frontend   - Start frontend in development mode"
	@echo ""
	@echo "Testing:"
	@echo "  test           - Run all tests"
	@echo "  test-backend   - Run backend tests"
	@echo "  test-frontend  - Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint           - Lint all code"
	@echo "  lint-backend   - Lint backend code"
	@echo "  lint-frontend  - Lint frontend code"
	@echo "  format         - Format all code"
	@echo ""
	@echo "Build:"
	@echo "  build          - Build both frontend and backend"
	@echo "  build-backend  - Build backend"
	@echo "  build-frontend - Build frontend"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build   - Build Docker images"
	@echo "  docker-up      - Start Docker services"
	@echo "  docker-down    - Stop Docker services"
	@echo "  docker-clean   - Clean Docker resources"
	@echo ""
	@echo "Other:"
	@echo "  clean          - Clean build artifacts"

# Setup commands
setup: setup-backend setup-frontend

setup-backend:
	@echo "Setting up backend..."
	cd backend_new && uv sync

setup-frontend:
	@echo "Setting up frontend..."
	cd frontend_new && npm install

# Development commands
dev: dev-backend dev-frontend

dev-backend:
	@echo "Starting backend development server..."
	cd backend_new && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	@echo "Starting frontend development server..."
	cd frontend_new && npm run dev

# Testing commands
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend_new && uv run pytest

test-frontend:
	@echo "Running frontend tests..."
	cd frontend_new && npm test

# Code quality commands
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend code..."
	cd backend_new && uv run black --check app && uv run isort --check-only app && uv run flake8 app

lint-frontend:
	@echo "Linting frontend code..."
	cd frontend_new && npm run lint

format:
	@echo "Formatting code..."
	cd backend_new && uv run black app && uv run isort app
	cd frontend_new && npm run format

# Build commands
build: build-backend build-frontend

build-backend:
	@echo "Building backend..."
	cd backend_new && uv run build

build-frontend:
	@echo "Building frontend..."
	cd frontend_new && npm run build

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v --rmi all

# Clean command
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend_new/dist frontend_new/node_modules
	rm -rf backend_new/__pycache__ backend_new/.pytest_cache
	docker-compose down -v