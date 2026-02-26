# Frontend — Next.js App

Runs on `http://localhost:3000`. See the [root README](../README.md) for full project context.

## Setup

```bash
npm install
npm run dev
```

## Environment variables

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"   # Backend URL (optional, defaults to above)
```

## Routes

| Path | Description |
|---|---|
| `/properties` | Properties list with search |
| `/properties/new` | Entry choice (upload PDF or manual) |
| `/properties/new/upload` | PDF upload + extraction |
| `/properties/new/wizard` | 3-step creation wizard |
| `/properties/:id` | Property detail with inline editing |
