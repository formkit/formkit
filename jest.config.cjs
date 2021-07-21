module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/packages/**/__tests__/**/*spec.[jt]s?(x)'],
  moduleNameMapper: {
    '^@formkit/(.*)$': '<rootDir>/packages/$1/src'
  },
  globals: {
    'ts-jest': {
      useESM: true
    },
  },
};
