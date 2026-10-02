# Backend Code Style Guide

Conventions for this codebase, modeled on the auth module
([routes](../backend/routes/authRoutes.js) →
[controller](../backend/controllers/authController.js) →
[service](../backend/services/authService.js)). Every new route,
controller, and service must follow this file. The same style applies to
the EDUS LMS backend (`D:\EDUS_LMS\edusbackendv1`).

---

## 1. Layering

Request flow is always:

```
route → validateRequest(schema) → controller → service → model
```

- **Routes** wire paths to middleware + controller. No logic.
- **Controllers** are thin: destructure the input, call one service
  function, send the response. No business logic, no DB access.
- **Services** hold all business logic and DB access — including data
  transformations like password hashing — and return the full response
  envelope.
- **Models** hold only the schema definition (fields, indexes, plugin
  registrations). No logic.

## 2. Imports

- Routes import controllers, and controllers import services, with
  **namespace imports** — never default imports:

  ```js
  import * as authController from "../controllers/authController.js";
  import * as authService from "../services/authService.js";
  ```

- Utilities, models, and config use default imports
  (`import ApiError from "../utils/apiError.js"`).
- Always include the `.js` extension (ESM).

## 3. Routes (`backend/routes/*Routes.js`)

- **Always maintain the central route registry `routes/index.js`.**
  Every route module is mounted there — never directly in `app.js`.
  `app.js` mounts only the aggregate router, once:

  ```js
  // routes/index.js
  import express from "express";

  import authRoutes from "./authRoutes.js";
  import userRoutes from "./userRoutes.js";

  const router = express.Router();

  // /api/auth
  router.use("/auth", authRoutes);

  // /api/users
  router.use("/users", userRoutes);

  export default router;
  ```

  ```js
  // app.js — the only route mount
  import routes from "./routes/index.js";

  app.use("/api", routes);
  ```

  A new `<thing>Routes.js` file is not done until it is registered in
  `routes/index.js`, with a comment line stating its base path.

- One comment line above each route stating the METHOD and full path:

  ```js
  // POST /api/auth/login
  router.post("/login", validateRequest(loginValidation), authController.login);

  // GET /api/auth/me
  router.get("/me", protect, authController.getMe);
  ```

- Blank line between routes.
- Middleware order: `protect` → `authorize(...)` → `validateRequest(...)`
  → controller.
- **No `router.param("id", validateObjectId)`** — `:id` params are
  validated through the endpoint's Joi schema (see §10). Routes with an
  `:id` but no body apply the exported id-only schema:

  ```js
  // GET /api/users/:id
  router.get(
    "/:id",
    protect,
    authorize(USER_ROLES.ADMIN),
    validateRequest(userIdValidation),
    userController.getUserById,
  );
  ```

- No per-route rate limiters — the single global `apiRateLimiter`
  mounted on `/api` in `app.js` is the only limiter.

## 4. Controllers (`backend/controllers/*Controller.js`)

- One comment line above each handler with METHOD and path.
- **Small bodies (1–3 fields): destructure `req.body` first**, then pass
  named variables to the service — never reach into `req.body.x` inline:

  ```js
  // POST /api/auth/login
  export const login = async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const data = await authService.login(username, password);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
  ```

- **Big payloads (4+ fields): pass `req.body` whole and destructure at
  the top of the service** — a long field list rebuilt in the controller
  is noise, and the whitelist in the service is what actually guards the
  fields:

  ```js
  // controller
  const data = await userService.createUser(req.body, req.user.id);

  // service
  const createUser = async (payload, actorId) => {
    try {
      const { username, password, fullName, role, email, phone } = payload;
      let { employeeId } = payload; // let only when reassigned later
  ```

- Every handler: `try { ... } catch (error) { next(error); }` — errors
  always go to the error middleware, never handled in the controller.
- The service's return value is sent as-is: `res.status(200).json(data)`.
- File ends with named exports collected in a default export object:

  ```js
  export default { login, logout, refreshToken, getMe, updateProfile, changePassword };
  ```

## 5. Services (`backend/services/*Service.js`)

- Group related functions under section header comments, with generous
  blank lines between logical blocks ("maintain space"):

  ```js
  // ============================================
  // Auth Operations
  // ============================================
  ```

- Every function body is wrapped in `try/catch` and rethrows through
  `handleServiceError`:

  ```js
  } catch (error) {
    throw handleServiceError(error, "Error in login");
  }
  ```

- Every function returns the response envelope:

  ```js
  return {
    success: true,
    message: "Login successful",
    data: { ... }, // or null
  };
  ```

- Errors are thrown with the `ApiError` static helpers plus an error
  code from `constants/errorCodes.js` — never `new ApiError(...)`
  directly, never bare strings:

  ```js
  throw ApiError.unauthorized(
    "Invalid username or password",
    ERROR_CODES.AUTH_INVALID_CREDENTIALS,
  );
  ```

- Add a short comment block above any non-obvious decision explaining
  *why* (see the refresh-token match check in authService.js).
- Shape response objects **inline** in each function — no shared
  `sanitizeUser`-style formatter utils:

  ```js
  data: {
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
    },
  },
  ```

- **No redundant normalization** — never re-trim / re-lowercase /
  re-uppercase values in the service. Joi schemas normalize
  (`.trim().lowercase()` etc.) and `validateRequest` writes the
  converted value back to `req.body`; the model's schema setters
  (`trim: true, lowercase: true`) cover saves and query filters. A line
  like `username = username?.trim().toLowerCase()` in a service is dead
  weight:

  ```js
  // WRONG - Joi and the schema setters already did this
  username = username?.trim().toLowerCase();
  ```

- **Whitelist update fields** — never spread a request body into an
  update query. Build the update object key by key:

  ```js
  const updates = {};
  if (data.fullName !== undefined) updates.fullName = data.fullName;
  if (data.email !== undefined) updates.email = data.email;
  ```

## 6. Auth-specific rules

- Token signing lives only in the `generateTokens` helper
  (`helpers/auth/generateTokens.js`); the auth service imports it.
  Sign and verify always through `config` (never `process.env`
  directly), so secrets can't drift.
- Password hashing and verification live only in the
  `helpers/auth/hashPassword.js` and `helpers/auth/comparePassword.js`
  helpers (salt rounds from `AUTH_CONFIG` in `config/constants.js`) —
  services call them explicitly; never `bcrypt.*` inline in a service,
  never a hashing hook in the model (§7).
- Refresh tokens are **persisted on the user document**
  (`select: false`), **matched** on refresh, **rotated** on every
  refresh, and **cleared** on logout and password change.
- Credential failures return the same generic message for unknown user
  and wrong password ("Invalid username or password") — don't reveal
  which one failed.
- Sensitive model fields (`password`, `refreshToken`) are `select: false`
  and loaded only with an explicit `.select("+field")`.

## 7. Models (`backend/models/*.js`)

- A model file contains **only** the schema definition — fields,
  indexes, and plugin registrations (e.g. `mongoosePaginate`). Nothing
  else. Keep models lean; do not put unnecessary things in them.
- **No hooks, no instance methods, no logic in model files.** Data
  transformations (password/PIN hashing, token handling) happen in the
  service, through a helper (§8):

  ```js
  // WRONG — logic hidden in the model
  userSchema.pre("save", async function () {
    this.password = await bcrypt.hash(this.password, 10);
  });

  // RIGHT — the service transforms explicitly via a helper
  user.password = await hashPassword(newPassword);
  await user.save();
  ```

- The cost of this explicitness: **nothing hashes automatically.** Every
  code path that writes a password or PIN — create user, change
  password, reset password, seed scripts — must call the hash helper
  itself. Check for this in review on every new write path.
- **No middleware in model files** — Express middleware lives in
  `backend/middlewares/`, never alongside a schema.
- No business logic, no queries, no services, no utilities inside a
  model file. If a function is not part of the schema itself, it does
  not belong there.

## 8. Helpers (`backend/helpers/`, `backend/utils/`)

- Any reusable helper function must be a **separate file**, not defined
  inline inside a model, service, controller, or route:

  ```js
  // helpers/auth/generateOtp.js — one helper, one file
  export const generateOtp = () => { ... };
  ```

  ```js
  // imported where needed, with a note on why it was extracted
  import { generateOtp } from "../helpers/auth/generateOtp.js";
  ```

- One helper per file, named after the function, grouped in a folder per
  domain (`helpers/auth/`, `helpers/payments/`, ...).
- Generic cross-domain utilities (`apiError.js`, `handleServiceError.js`)
  live in `backend/utils/`; domain-specific extractions live in
  `backend/helpers/<domain>/`.

## 9. Constants & configuration

- **No magic values in helpers, services, or validations.** Domain
  constants (prefixes, digit counts, enums, thresholds) live in
  `backend/config/constants.js` as frozen objects:

  ```js
  export const EMPLOYEE_ID_CONFIG = Object.freeze({
    PREFIXES: Object.freeze({
      [USER_ROLES.MANAGER]: "MAN",
      [USER_ROLES.CASHIER]: "CASH",
    }),
    DIGITS: 4,
  });
  ```

  Consumers import from config — never redeclare the value locally:

  ```js
  import { EMPLOYEE_ID_CONFIG } from "../../config/constants.js";
  ```

- Environment-driven values (secrets, URLs, expiry windows) stay in
  `backend/config/env.js`; fixed domain values go in
  `config/constants.js`. Error codes remain in
  `backend/constants/errorCodes.js`.
- Role strings come from `USER_ROLES` in `config/constants.js` rather
  than being retyped inline.

## 10. Validation (`backend/validations/*Validation.js`)

- One Joi schema per endpoint, named `<action>Validation`, applied in
  the route via `validateRequest(schema)`. A schema is a plain object
  with `params` / `query` / `body` keys — `validateRequest` checks each
  location it finds.
- **Route params are validated here, not in middleware.** Each file
  declares a local `objectId` rule and a shared `idParamSchema`, spreads
  it into every schema for an `:id` route, and exports it as
  `<thing>IdValidation` for routes with no body:

  ```js
  const objectId = Joi.string().hex().length(24);

  const idParamSchema = {
    params: Joi.object({
      id: objectId.required(),
    }).unknown(true),
  };

  export const updateUserValidation = {
    ...idParamSchema,
    body: Joi.object({ ... }).unknown(true),
  };

  export const userIdValidation = idParamSchema;
  ```

- Required fields carry custom messages:

  ```js
  username: Joi.string().trim().required().messages({
    "any.required": "Username is required",
    "string.empty": "Username is required",
  }),
  ```

## 11. List endpoints & pagination

- List endpoints take their criteria — pagination, filters, search — in
  the **request body**, never the query string. Since GET bodies are
  dropped by browsers and proxies, the route is `POST /<resource>/list`:

  ```js
  // POST /api/users/list
  router.post(
    "/list",
    protect,
    authorize(USER_ROLES.ADMIN),
    validateRequest(getUsersValidation),
    userController.getUsers,
  );
  ```

- The body schema validates `page` and `limit` as positive integers,
  `search` as a trimmed string, and every filter field — enum filters
  restricted to their `config/constants.js` values:

  ```js
  export const getUsersValidation = {
    body: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).optional(),
      search: Joi.string().trim().allow("").optional(),
      role: Joi.string()
        .valid(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER)
        .optional(),
    }).unknown(true),
  };
  ```

- Pagination runs through **mongoose-paginate-v2**. The model registers
  the plugin as part of its schema definition:

  ```js
  userSchema.plugin(mongoosePaginate);
  ```

  and the service calls `Model.paginate(...)` — never a manual
  `.skip()/.limit()` chain plus a separate `countDocuments`:

  ```js
  const result = await User.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
  });
  ```

- `page` and `limit` still pass through `getPagination`
  (`utils/pagination.js`) first, so the default and maximum limits apply
  before the plugin sees them.
- The plugin result is mapped **inline** into the standard list
  envelope — plugin field names never leak out of the service:

  ```js
  data: {
    count: result.docs.length,
    total: result.totalDocs,
    page: result.page,
    pages: result.totalPages,
    data: result.docs.map((user) => ({ ... })),
  },
  ```

## 12. Formatting

- Double quotes, semicolons, trailing commas (Prettier defaults for
  this repo).
- Multi-line call arguments each on their own line with a trailing
  comma.
- Blank line between every logical step inside a function: lookup,
  guard clauses, mutation, save, return.
