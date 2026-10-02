# POS System

A multi-store, offline-capable grocery / supermarket Point of Sale system
built on the MERN stack.

## Structure

```text
backend/    Express + MongoDB API (ESM)
frontend/   React + Vite app (POS terminal + back office)
docs/       Product docs and mandatory code style guides
```

## Documentation

Start at [docs/README.md](docs/README.md):

- [System Overview](docs/pos-system-overview.md)
- [Feature Specification](docs/pos-features.md)
- [Data Models](docs/pos-data-models.md)
- [Delivery Roadmap](docs/pos-roadmap.md)
- Code conventions: [Backend](docs/backend-code-style-guide.md) ·
  [Frontend](docs/frontend-code-style-guide.md)

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI + JWT secrets
npm install
npm run seed:admin     # creates the first admin user
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env   # points at the backend API
npm install
npm run dev
```
