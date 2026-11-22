import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-react-native-a11y";
import tseslint from "typescript-eslint";

const noImpureInDomain = [
  {
    selector: "NewExpression[callee.name='Date']",
    message: "Domínio puro: receba `now` por parâmetro (sem new Date()).",
  },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: "Domínio puro: receba `now` por parâmetro.",
  },
  {
    selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
    message: "Domínio puro: aleatoriedade e IDs são injetados.",
  },
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "dist/",
      "coverage/",
      "**/*.gen.ts",
      "babel.config.js",
      "jest.css-stub.js",
      "metro.config.js",
      "tailwind.config.js",
      "scripts/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "react-native-a11y": a11y, boundaries },
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
      "boundaries/elements": [
        { type: "route", pattern: "app" },
        { type: "feature", pattern: "src/features/*", capture: ["name"] },
        { type: "domain", pattern: "src/domain" },
        { type: "data", pattern: "src/data" },
        { type: "shared", pattern: "src/shared" },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...a11y.configs.all.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "Platform",
          property: "OS",
          message: "Platform.OS só em src/data/platform e src/shared/ui.",
        },
      ],
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            // Cada elemento pode importar de si mesmo; entre features e a partir das rotas só pelo index.
            { allow: { dependency: { relationship: { to: "internal" } } } },
            { from: { element: { type: "route" } }, allow: { to: { element: { type: "shared" } } } },
            {
              from: { element: { type: "route" } },
              allow: { to: { element: { type: "feature", fileInternalPath: "index.{ts,tsx}" } } },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { types: ["domain", "data", "shared"] } } },
            },
            {
              from: { element: { type: "feature" } },
              allow: { to: { element: { type: "feature", fileInternalPath: "index.{ts,tsx}" } } },
            },
            {
              from: { element: { type: "data" } },
              allow: { to: { element: { types: ["domain", "shared"] } } },
            },
          ],
        },
      ],
    },
  },
  // Domínio puro: sem React, Expo, relógio nem aleatoriedade.
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["**/__tests__/**"],
    rules: {
      "no-restricted-syntax": ["error", ...noImpureInDomain],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-*", "react/*", "expo", "expo-*", "@expo/*"],
              message: "Domínio não conhece React nem Expo.",
            },
          ],
        },
      ],
    },
  },
  // Platform.OS permitido só nos adaptadores.
  { files: ["src/data/platform/**", "src/shared/ui/**"], rules: { "no-restricted-properties": "off" } },
);
