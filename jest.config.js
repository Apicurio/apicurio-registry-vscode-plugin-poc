module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/__tests__/**/*.tsx',
        '**/?(*.)+(spec|test).ts',
        '**/?(*.)+(spec|test).tsx'
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                jsx: 'react'
            }
        }]
    },
    moduleNameMapper: {
        '^vscode$': '<rootDir>/src/__mocks__/vscode.ts',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/test/**',
        '!src/**/*.test.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ]
};