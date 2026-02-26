.PHONY: dev backend frontend install seed db-migrate db-reset help

# Default target
.DEFAULT_GOAL := help

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

dev: ## Start both backend and frontend in parallel
	@$(MAKE) -j2 backend frontend

backend: ## Start backend (NestJS on :3001)
	cd backend && npm run start:dev

frontend: ## Start frontend (Next.js on :3000)
	cd frontend && npm run dev

install: ## Install dependencies for both
	cd backend && npm install
	cd frontend && npm install

seed: ## Seed the database with demo data
	cd backend && npx prisma db seed

db-migrate: ## Run database migrations
	cd backend && npx prisma migrate dev

db-reset: ## Reset database and re-seed
	cd backend && npx prisma migrate reset --force

build: ## Build both for production
	cd backend && npm run build
	cd frontend && npm run build
