import tseslint from "typescript-eslint";

// eslint-config-next se descartó: su árbol de dependencias antiguas
// (semver@6, eslint-plugin-import) viola el trustPolicy de pnpm.
export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
