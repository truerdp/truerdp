# Project Coding Rules (Non-Obvious Only)

- Always use API wrappers:
  - Browser: [clientApi()](packages/api/src/client.ts:15)
  - Next server components/handlers: [serverApi()](packages/api/src/server.ts:39) (depends on next/headers; not safe outside Next)
  - Avoid raw fetch to retain credentials: "include" and uniform error handling from [fetcher()](packages/api/src/fetcher.ts:76).

- POST/PUT/PATCH body behavior:
  - If body is null, fetcher sends {} with Content-Type: application/json. To send no body or non-JSON, pass FormData, string, or URLSearchParams explicitly.

- Class names:
  - Use [cn()](packages/ui/src/lib/utils.ts:4) to compose Tailwind classes; Prettier tailwind plugin recognizes cn/cva and sorts based on [globals.css](packages/ui/src/styles/globals.css:1).

- Routes:
  - Use typed path helpers ([webPaths](apps/web/lib/paths.ts:3), [dashboardPaths](apps/dashboard/lib/paths.ts:3), [adminPaths](apps/admin/lib/paths.ts:3)). For dynamic builders, ensure the return type is Route.

- Imports:
  - Import UI/components/hooks via @workspace/ui exports (see [packages/ui/package.json](packages/ui/package.json:47) "exports"). Do not deep-import unexported internals.

- Base URL resolution when calling APIs:
  - Respect precedence baked into wrappers; do not hardcode URLs. See [getBaseUrl()](packages/api/src/client.ts:9) and [getBaseUrl()](packages/api/src/server.ts:22).
