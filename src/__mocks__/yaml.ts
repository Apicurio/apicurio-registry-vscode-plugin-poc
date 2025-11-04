/**
 * Mock for 'yaml' module in tests.
 * We don't need actual YAML parsing in unit tests.
 */

export const parse = jest.fn((str: string) => {
    try {
        return JSON.parse(str);
    } catch {
        return {};
    }
});

export const stringify = jest.fn((obj: any) => {
    return JSON.stringify(obj, null, 2);
});

export default {
    parse,
    stringify
};
