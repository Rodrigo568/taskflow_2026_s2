/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/types/**'],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 40,
    },
  },
  testTimeout: 20000,
};
