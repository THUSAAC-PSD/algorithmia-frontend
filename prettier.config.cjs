/**
 * CommonJS Prettier config for CLI tooling.
 * This mirrors prettier.config.ts but uses Node-friendly exports so the
 * Prettier CLI (which may use require) can load it during pre-commit hooks.
 */
module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  proseWrap: 'always',
};
