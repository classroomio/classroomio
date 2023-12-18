/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {};

export default config;

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.ts$': 'ts-jest',
    '\\.[jt]sx?$': 'babel-jest'
  }
};
