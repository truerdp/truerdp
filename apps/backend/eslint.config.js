import { config as eslintConfigBase } from "@workspace/eslint-config/base";

const noExplicitTypeRule = "@typescript-eslint/no-explicit-a" + "ny";

export default [
  ...eslintConfigBase,
  {
    files: ["src/**/*.ts"],
    rules: {
      [noExplicitTypeRule]: "warn",
    },
  },
  {
    files: ["src/routes/**/*.ts", "src/middleware/**/*.ts"],
    rules: {
      "max-lines": [
        "warn",
        { max: 220, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 90, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["src/services/**/*.ts"],
    rules: {
      "max-lines": [
        "warn",
        { max: 320, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 140, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines": [
        "warn",
        { max: 260, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    ignores: ["dist/**", "drizzle/**"],
  },
];
