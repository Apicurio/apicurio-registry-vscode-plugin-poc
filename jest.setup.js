// Jest setup file for webview tests that need browser environment
require('@testing-library/jest-dom');

// @apicurio/data-models expects 'self' to be defined (browser global)
// In Node/Jest, we need to polyfill it
global.self = global;

// Mock window object if needed
global.window = global.window || {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};
