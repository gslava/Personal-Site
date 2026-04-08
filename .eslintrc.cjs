module.exports = {
  root: true,
  ignorePatterns: ['dist/**/*', 'coverage/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint', '@angular-eslint'],
      rules: {
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
          },
        ],
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
          },
        ],
      },
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended', 'plugin:@angular-eslint/template/accessibility'],
      parser: '@angular-eslint/template-parser',
    },
  ],
};
