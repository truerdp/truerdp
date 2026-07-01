import * as migration_20260605_044628_initial_cms_schema from "./20260605_044628_initial_cms_schema"
import * as migration_20260701_154500_add_offer_marquee_to_home_page from "./20260701_154500_add_offer_marquee_to_home_page"

export const migrations = [
  {
    up: migration_20260605_044628_initial_cms_schema.up,
    down: migration_20260605_044628_initial_cms_schema.down,
    name: "20260605_044628_initial_cms_schema",
  },
  {
    up: migration_20260701_154500_add_offer_marquee_to_home_page.up,
    down: migration_20260701_154500_add_offer_marquee_to_home_page.down,
    name: "20260701_154500_add_offer_marquee_to_home_page",
  },
]
