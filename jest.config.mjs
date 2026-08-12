export default {
  rootDir: new URL('.', import.meta.url).pathname,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  // lodash-es (an ESM-only package) is pulled in transitively by several components;
  // transform it too instead of leaving it in the default node_modules ignore list.
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // Explicit preset (instead of relying on .babelrc file discovery) because Babel does not
    // apply a project-root .babelrc across the node_modules package boundary.
    '^.+\\.jsx?$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(lodash-es)/)'],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/index.tsx', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  testMatch: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
};
