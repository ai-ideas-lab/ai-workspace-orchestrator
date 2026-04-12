module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true,
  coverageDirectory: 'coverage-simple',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/__tests__/**/*',
  ],
};