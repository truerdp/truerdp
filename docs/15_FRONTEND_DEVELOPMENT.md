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
