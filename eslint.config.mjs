import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettier from "eslint-plugin-prettier";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Use Next.js and TypeScript core configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // TypeScript configuration
  {
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: ["./tsconfig.json"],
      },
    },
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // React configuration
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    files: ["**/*.jsx", "**/*.tsx"],
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/prop-types": "off", // Not needed with TypeScript
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          ignoreCase: true,
          reservedFirst: true,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Prettier integration
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": [
        "warn",
        {
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: "avoid",
          endOfLine: "auto",
        },
      ],
      // Avoid conflicts with Prettier
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },

  // General rules for all files
  {
    rules: {
      "no-console": "warn",
      eqeqeq: ["error", "always"],
      curly: ["warn", "all"],
      "no-trailing-spaces": "warn",
      "max-len": [
        "warn",
        { code: 100, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true },
      ],
      "no-multiple-empty-lines": ["warn", { max: 1, maxEOF: 0 }],
      "comma-dangle": [
        "warn",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
        },
      ],
    },
  },
];

export default eslintConfig;
