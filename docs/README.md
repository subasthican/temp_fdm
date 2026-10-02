# Documentation

A multi-store, offline-capable **grocery / supermarket POS** on the MERN
stack. Start with the overview, then the feature spec.

## Progress

- [Feature Phases](./feature-phases.md) — phase-wise feature list
  (1.1, 1.2, …) with live build status (done / remaining / dropped).
- [Development Log](./dev-log.md) — daily record of what was done,
  decided, and verified. Updated at the end of every working session.
- [Postman Collection](./postman/POS-System.postman_collection.json) —
  importable API collection (45 requests, all endpoints); login/refresh
  auto-save tokens, create/list requests auto-capture ids. Pair it with
  the [Local Environment](./postman/POS-System.postman_environment.json)
  (baseUrl, credentials, tokens, and captured ids).

## Product & planning

- [POS System Overview](./pos-system-overview.md) — vision, tech stack,
  roles, multi-store model, offline-first strategy, and architecture.
- [Feature Specification](./pos-features.md) — every module in full,
  tagged MVP / Phase 2 / Phase 3.
- [Data Models](./pos-data-models.md) — MongoDB collections and key
  fields.
- [Delivery Roadmap](./pos-roadmap.md) — phased build plan and concrete
  first steps.

## Code conventions (mandatory)

- [Backend Code Style Guide](./backend-code-style-guide.md) — conventions
  for routes, controllers, services, models, helpers, constants,
  validation, and pagination. Modeled on the auth module; every new
  backend file must follow it.
- [Frontend Code Style Guide](./frontend-code-style-guide.md) —
  conventions for the `frontend/` React app: directory layout, data flow
  (React Query hooks + services), UI kit, theming, constants, and state
  management. Modeled on `SuppliersPage.jsx`; every new page must follow
  it.
