You are working inside a Turborepo monorepo with multiple Next.js apps.

Tech stack:

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (Base UI primitives, not Radix)
- Components are imported from "@workspace/ui"

IMPORTANT RULES:

- Do NOT use @radix-ui/\*
- Use existing shadcn components from "@workspace/ui"
- Follow the actual implementation of components (do not assume props like asChild)
- Prefer composition patterns supported by the existing components
- Use Tailwind classes only (no CSS files)
- Use shadcn skills and mcp wherever required
- Use shadcn blocks to save effort
- Use the local `hugeicons` skill when choosing or searching for icons
- Use Hugeicons instead of raw SVGs. The packages are already installed in this monorepo.
- Follow the existing icon pattern:
  - import `HugeiconsIcon` from `@hugeicons/react`
  - import icons from `@hugeicons/core-free-icons`
- Prefer supported Hugeicons props over `className` when possible:
  - use `size` for icon size
  - use `color` for icon color
  - use `strokeWidth` for stroke thickness
  - use `altIcon` and `showAlt` for stateful icon swaps
  - keep `className` for animation or layout-only cases

- Keep components clean, reusable, and minimal

General UI rules:

- Use proper loading states
- Use empty states where needed
- Avoid over-engineering
- Keep UI production-ready but simple

API base:

- All API calls go through a helper: api(url, options)

Auth:

- JWT stored in localStorage
- API requires Authorization header

Now generate UI code based on the task below.
