module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {},
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
      },
    }
  },
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    '/**/*.html'
  ],
  plugins: [
    'react',
    'react-refresh',
    '@typescript-eslint',
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies : true,
        packageDir: './'
      }
    ],
    'react/jsx-filename-extension': [
      'error',
      {
        'extensions': ['.js', '.jsx', '.tsx', '.ts']
      }
    ],
    'react/react-in-jsx-scope': 'off',
    'no-console': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never'
      }
    ]
  },
}
