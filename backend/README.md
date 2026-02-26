# Backend — NestJS API

Runs on `http://localhost:3001`. See the [root README](../README.md) for full project context.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and optional AI keys
npx prisma migrate dev
npm run start:dev
```

## Key endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/properties` | List all properties (summary) |
| `GET` | `/api/properties/:id` | Full property with buildings + units |
| `POST` | `/api/properties` | Create property |
| `PATCH` | `/api/properties/:id` | Update property fields |
| `DELETE` | `/api/properties/:id` | Delete property |
| `PATCH` | `/api/buildings/:id` | Update building fields |
| `PATCH` | `/api/units/:id` | Update unit fields |
| `POST` | `/api/extraction/upload` | Upload PDF, returns extracted data |

## Environment variables

```env
DATABASE_URL="postgresql://..."

# AI extraction (all optional)
GEMINI_API_KEY=""          # Primary AI fallback
OPENAI_API_KEY=""          # Wired but untested
OLLAMA_BASE_URL="http://localhost:11434"   # Local AI (free)
OLLAMA_MODEL="llama3.2"    # Override Ollama model
```
