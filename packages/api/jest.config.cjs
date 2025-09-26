module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // Increase default timeout for blockchain tests
  testMatch: [
    "**/test/**/*.test.ts",
    "**/test/**/*.spec.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/pallets/test/"  // Ignore integration test files that are meant to be run with tsx
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: false
    }
  }
};