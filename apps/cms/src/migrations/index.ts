import * as migration_20260605_044628_initial_cms_schema from "./20260605_044628_initial_cms_schema"

export const migrations = [
  {
    up: migration_20260605_044628_initial_cms_schema.up,
    down: migration_20260605_044628_initial_cms_schema.down,
    name: "20260605_044628_initial_cms_schema",
  },
]
