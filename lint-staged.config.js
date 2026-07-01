module.exports = {
  // Run ESLint on source files only; skip docs/*.md to avoid markdown parser noise
  '**/*.{js,jsx,ts,tsx,mjs,cjs}': ['eslint --fix --no-warn-ignored'],
  '**/*.ts?(x)': () => 'pnpm check-types',
};
