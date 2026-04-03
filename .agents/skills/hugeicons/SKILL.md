---
name: hugeicons
description: Helps with Hugeicons icon discovery and usage through the Hugeicons MCP server. Use when working with Hugeicons, searching icon names, finding matching icons by keyword, checking supported styles or glyphs, or getting platform-specific Hugeicons usage guidance for React, Next.js, Vue, Angular, Svelte, React Native, Flutter, or HTML.
user-invocable: false
---

# Hugeicons

Use this skill when the user wants to work with the Hugeicons library or when a UI task would benefit from browsing the Hugeicons MCP server instead of guessing icon names.

## When To Use

- Find a Hugeicons icon by name or keyword
- Compare candidate icons for a UI action or status
- Get Hugeicons usage guidance for a platform
- Retrieve glyph data for font-based integrations
- Confirm available styles before choosing an icon set

## Workflow

1. Use the Hugeicons MCP server to search before hardcoding icon names.
2. Prefer `search_icons` for intent-based discovery and `list_icons` when you need broader browsing.
3. Use `get_platform_usage` when the task depends on framework-specific installation or import guidance.
4. For font-based or unicode-based use cases, use `get_icon_glyphs` or `get_icon_glyph_by_style`.
5. If the project already uses a different icon library, only switch to Hugeicons when the user asks or the codebase clearly expects it.

## Hugeicons MCP Surface

- `list_icons`: list all available Hugeicons icons
- `search_icons`: search by name or tags
- `get_platform_usage`: get usage instructions for a platform
- `get_icon_glyphs`: get glyphs for an icon across styles
- `get_icon_glyph_by_style`: get the glyph for a specific icon style

## Monorepo Usage

This repo already uses Hugeicons across apps and `@workspace/ui`.

- Import the renderer from `@hugeicons/react`
- Import icon definitions from `@hugeicons/core-free-icons`
- Match the existing component pattern instead of hand-rolling SVG markup

```tsx
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, ServerStack01Icon } from "@hugeicons/core-free-icons"

<HugeiconsIcon icon={ServerStack01Icon} className="size-5" />
<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
```

## Repo-Specific Guidance

- `packages/ui` already depends on Hugeicons and uses it in shared components.
- The apps also declare Hugeicons, so app-level components can follow the same imports.
- Prefer copying an existing pattern from shared UI components when you need sizing, spin states, or muted icon treatment.
- If you need a better icon match, search with the Hugeicons MCP server first instead of guessing names.

## Useful Local References

- `packages/ui/src/components/spinner.tsx`
- `packages/ui/src/components/carousel.tsx`
- `apps/dashboard/components/instance-table.tsx`

For the server config and resource list, see [mcp.md](./mcp.md).
