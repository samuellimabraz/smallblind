import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/', '<rootDir>/__tests__/'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // Setup environment variables for testing
    setupFiles: ['<rootDir>/jest.setup.ts'],
    // Mock Prisma client
    moduleNameMapper: {
        '@prisma/client': '<rootDir>/__mocks__/prisma.ts',
    },
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__mocks__/',
        '/dist/'
    ],
};

export default config; 