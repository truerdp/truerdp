# Hugeicons MCP

Source used: `https://github.com/hugeicons/mcp-server`

## Server Config

```json
{
  "mcpServers": {
    "hugeicons": {
      "command": "npx",
      "args": ["-y", "@hugeicons/mcp-server"]
    }
  }
}
```

## Tools

- `list_icons`
- `search_icons`
- `get_platform_usage`
- `get_icon_glyphs`
- `get_icon_glyph_by_style`

## Resources

- `hugeicons://docs/platforms/react`
- `hugeicons://docs/platforms/vue`
- `hugeicons://docs/platforms/angular`
- `hugeicons://docs/platforms/svelte`
- `hugeicons://docs/platforms/react-native`
- `hugeicons://docs/platforms/flutter`
- `hugeicons://docs/platforms/html`
- `hugeicons://icons/index`

## Notes

- The server is distributed as `@hugeicons/mcp-server`.
- The upstream README recommends `npx -y @hugeicons/mcp-server` for local execution.
- Use `get_platform_usage` before inventing install or import snippets.
