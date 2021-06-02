module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  extensionsToTreatAsEsm: [".ts"],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/packages/**/__tests__/**/*spec.[jt]s?(x)'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
