import { config as eslintConfigBase } from "@workspace/eslint-config/base";

export default [
  ...eslintConfigBase,
  {
    ignores: ["dist/**", "drizzle/**"],
  },
];
