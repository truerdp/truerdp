import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["app/**/*.tsx", "app/**/*.ts"],
    rules: {
      "max-lines": [
        "warn",
        { max: 260, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    files: ["components/**/*.tsx", "hooks/**/*.ts", "lib/**/*.ts"],
    rules: {
      "max-lines": [
        "warn",
        { max: 220, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]
