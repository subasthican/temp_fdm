# Frontend Code Style — POS System

Mandatory conventions for all code under `frontend/`. The reference
implementation is **[SuppliersPage.jsx](../frontend/src/pages/suppliers/SuppliersPage.jsx)**
— when in doubt, copy its patterns. (Backend rules live in
[backend-code-style-guide.md](./backend-code-style-guide.md).)

---

## 1. Directory layout

```text
src/
  constants/       Global constants — colors, images, enums, routes, query keys
  components/
    ui/            Reusable, domain-free UI kit (Button, Input, Card, ...)
    <domain>/      Domain components (pos/, inventory/, reports/, ...)
  hooks/
    api/           useApiQuery / useApiMutation (React Query wrappers)
    use*.js        Other shared hooks (useDebounce, useOfflineSync, ...)
  layouts/         MainLayout (back office), POSLayout (cashier)
  pages/<domain>/  One folder per domain, one file per page
  services/        One axios service module per backend resource
  store/           Zustand stores (use*Store.js)
  utils/           Pure helpers (formatters, validators, url resolvers)
```

Rules:

- **Pages** compose UI-kit components + domain components and call hooks.
  They never call axios or `api` directly.
- **Services** are the only place HTTP happens. Every method unwraps with
  `unwrapApiData` and returns plain data.
- **UI-kit components** (`components/ui/`) must be domain-free: no service
  imports, no store imports, no business wording baked in.

## 2. Data flow (page → API)

```text
Page → useApiQuery / useApiMutation → service → api.js (axios) → backend
```

### Reads — `useApiQuery`

```jsx
import { useApiQuery } from '../../hooks/api';
import { queryKeys } from '../../constants';

const { data, isLoading, errorMessage } = useApiQuery(
  queryKeys.suppliers.list({ search }),
  () => supplierService.getSuppliers({ search }),
  { enabled: !!search },            // any React Query option
);
```

- **Never** import `useQuery` directly in a page — always `useApiQuery`.
- **Never** write a raw key array — always a factory from
  [queryKeys.js](../frontend/src/constants/queryKeys.js). Add new
  factories there when adding a resource.
- Caching is global (5 min staleTime, 1 retry — see `main.jsx`);
  override per query only when needed.

### Writes — `useApiMutation`

```jsx
const deleteSupplier = useApiMutation(supplierService.deleteSupplier, {
  successMessage: 'Supplier removed',
  invalidateKeys: [queryKeys.suppliers.all],
});
```

- Success/error toasts and cache invalidation are handled by the hook —
  do **not** call `toast.error` in `onError` or `queryClient.invalidateQueries`
  manually.
- Use `isPending` for button `loading` props.

### Errors

All user-facing error text for failed requests comes from
`getApiErrorMessage(error)` ([apiError.js](../frontend/src/utils/apiError.js)).
Never render `error.message` or `error.response?.data?.message` directly.

## 3. Loading, empty and error states — required

Every page that fetches data must handle all three states. The standard
pattern:

```jsx
{isLoading ? (
  <LoadingState message="Loading suppliers..." />
) : errorMessage ? (
  <EmptyState title="Could not load suppliers" message={errorMessage} />
) : items.length === 0 ? (
  <EmptyState title="No suppliers yet" message="Add one using the form." />
) : (
  /* render list */
)}
```

## 4. Confirmations

`window.confirm` is banned. Use the global promise-based dialog:

```jsx
import { confirmDialog } from '../../components/ui';

const ok = await confirmDialog({
  title: 'Delete supplier?',
  message: `"${supplier.name}" will be removed permanently.`,
  confirmText: 'Delete',
  variant: 'danger',        // 'danger' (default) | 'primary'
});
if (ok) deleteMutation.mutate(supplier._id);
```

`<ConfirmDialogHost />` is mounted once in `App.jsx` — never mount it again.

## 5. UI kit

Import from the barrel: `import { Button, Card, Input } from '../../components/ui';`

| Component | Use for |
|---|---|
| `Button` | Every clickable action. Variants: `primary`, `secondary`, `danger`, `success`, `warning`, `outline`, `ghost`; `icon`, `loading`, `fullWidth` props. |
| `Input` | Single-line text/number/date fields. `label`, `error`, `helperText`, `leftIcon`/`rightIcon`. |
| `TextArea` | Multi-line text. Same chrome as Input. |
| `Select` | Short static dropdowns (native select). `options: [{ value, label }]`. |
| `SearchableSelect` | Long/filterable lists (products, customers, suppliers). Keyboard navigable. |
| `Card` | Every white content panel. `title`, `subtitle`, `actions`, `padding`. |
| `PageHeader` | Top of every back-office page. `title`, `subtitle`, `actions`. |
| `DataTable` | Tabular lists with sorting. |
| `Badge` | Status pills. Variants match the semantic palette. |
| `Spinner` / `LoadingState` | Inline spinner / full-area loading placeholder. |
| `EmptyState` | Empty lists and load failures. |
| `Modal` | Custom dialogs (forms, detail views). For yes/no questions use `confirmDialog`. |
| `FieldWrapper` | Only for building **new** field components — gives them the standard label/error/helper chrome. |

Do not hand-roll raw `<input className="input-field">`, ad-hoc buttons, or
bespoke panels in pages. If the kit is missing something, extend the kit.

## 6. Theme & colors

- Single source of truth: [colors.js](../frontend/src/constants/colors.js).
  Tailwind reads it in `tailwind.config.js`, so semantic classes exist for
  every token: `primary-*`, `success-*`, `warning-*`, `danger-*`, `info-*`.
- **No hex codes in components.** For JS color needs (Recharts, canvas),
  import `PALETTE` / `CHART_COLORS` / `STATUS_COLORS` from constants.
- Neutrals are the `gray-*` scale (not `slate-*`/`zinc-*` — legacy `slate`
  usages are being migrated).
- Radius: `rounded-lg` for fields/buttons/list rows, `rounded-xl` for cards,
  `rounded-2xl` for modals. Shadows: `shadow-sm` cards, `shadow-2xl` modals.
- Currency is always `formatCurrency()` — never manual `Rs. ${x}` strings.
- Scrollable containers (`overflow-y-auto`) always get the `scrollbar-thin`
  utility (defined in `index.css`) — never style scrollbars ad hoc.
- Overlays (modals, menus) render via `createPortal(..., document.body)` so
  they cover the full viewport — never position them inside layout containers.

## 7. Constants

Import from the barrel: `import { ROLES, ROUTES, PAYMENT_METHODS } from '../../constants';`

- `app.js` — roles, payment methods, currency, pagination, routes, debounce.
- `colors.js` — palette (also feeds Tailwind).
- `images.js` — placeholder images (`PRODUCT_PLACEHOLDER`, `AVATAR_PLACEHOLDER`).
- `queryKeys.js` — React Query key factories.

A string/number that appears in two files, or mirrors a backend enum,
belongs in `constants/` — never inline. Route paths come from `ROUTES`,
role checks from `ROLES` / `BACK_OFFICE_ROLES`.

Backend media paths (`/uploads/...`) are resolved **only** via
`resolveMediaUrl()` in [networkUrls.js](../frontend/src/utils/networkUrls.js)
— never re-derive the backend origin in a component.

## 8. Component conventions

- Function components with arrow syntax; default export for the main
  component of a file, named exports for secondary ones.
- Every reusable component declares `PropTypes`.
- File header: a short `/** ... */` block saying what the component is for.
- Naming: `PascalCase.jsx` components, `useCamelCase.js` hooks,
  `camelCase.js` utils/services, `SCREAMING_SNAKE_CASE` constants.
- Import order: react → third-party → services → hooks → constants →
  components → utils.
- Search inputs are debounced with `useDebounce(value, SEARCH_DEBOUNCE_MS)`.
- Icon-only buttons must have an `aria-label`.

## 9. State management

- **Server state** lives in React Query (via `useApiQuery`) — never copy
  fetched lists into Zustand or `useState`.
- **Client/UI state** (cart, auth session, hardware config, sidebar) lives
  in the existing Zustand stores. New global client state gets a
  `use<Name>Store.js` in `store/`.
- Local form state is plain `useState` in the page.

## 10. Checklist for a new page

1. Route added in `App.jsx` with the right `requiredRole`, path in `ROUTES`.
2. Starts with `<PageHeader>`; content in `<Card>`s; root is `space-y-6`.
3. Data via `useApiQuery` + `queryKeys`; writes via `useApiMutation` with
   `invalidateKeys`.
4. Loading / error / empty states all rendered (§3).
5. Destructive actions go through `confirmDialog` (§4).
6. No hex colors, no raw HTML form controls, no `window.confirm`,
   no direct `api`/axios calls, no raw query keys.
7. `npm run lint` passes.
