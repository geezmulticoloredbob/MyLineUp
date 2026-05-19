module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  setupFiles: ['<rootDir>/src/__tests__/setupEnv.js'],
  testTimeout: 30000,
};
