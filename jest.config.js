module.exports = {
  rootDir: __dirname,
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  collectCoverage: false,
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/index.tsx", "!src/**/*.d.ts"],
  coverageDirectory: "coverage",
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],  // Search everywhere for .test.ts and .spec.ts
  // testMatch: ["<rootDir>/tests/**/*.tests.ts", "<rootDir>/tests/**/*.spec.ts"],
};

