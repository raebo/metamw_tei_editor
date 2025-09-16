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
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/index.tsx', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  // testMatch: ["<rootDir>/tests/**/*.tests.ts", "<rootDir>/tests/**/*.spec.ts"],
};
