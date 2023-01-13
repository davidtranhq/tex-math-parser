/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node',
  globals: {
    'ts-jest': {
      // dramatic speed up of test suite at the cost of disabling type-checking
      // https://stackoverflow.com/questions/45087018/jest-simple-tests-are-slow
      isolatedModules: true
    }
  },
};