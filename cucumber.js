module.exports = {
  default: `
    --require-module ts-node/register
    --require support/**/*.ts
    --require features/step-definitions/**/*.ts
    features/**/*.feature
  `
};