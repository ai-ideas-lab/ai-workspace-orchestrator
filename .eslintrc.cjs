module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  env: {
    es2022: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ["coverage/", "dist/", "node_modules/"],
};
