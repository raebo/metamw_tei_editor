module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'jsx-a11y',
        'prettier'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended'
    ],
    rules: {
        // --- General
        'no-console': 'warn',
        'no-debugger': 'error',

        // --- Catch blocks
        'no-useless-catch': 'off',
        '@typescript-eslint/no-implicit-any-catch': ['warn', { allowExplicitAny: true }],

        // --- TS specifics
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off', // change to 'warn' or 'error' if desired
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

        // --- React
        'react/prop-types': 'off', // Using TypeScript types
        'react/react-in-jsx-scope': 'off', // Not needed with React 17+
        'react-hooks/exhaustive-deps': 'warn',

        // --- Code style
        'prettier/prettier': ['warn', {
            singleQuote: true,
            trailingComma: 'all',
            semi: true,
            printWidth: 100,
            tabWidth: 2,
            bracketSpacing: true,
            endOfLine: 'auto',
        }],
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};
