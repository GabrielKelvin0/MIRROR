import nextPlugin from "eslint-plugin-next";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      next: nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
