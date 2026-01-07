/**
 * Mock for 'yaml' module in tests.
 * Provides realistic YAML parsing behavior for unit tests.
 */

/**
 * Custom YAML parse error class that mimics the real yaml library.
 */
export class YAMLParseError extends Error {
    linePos?: Array<{ line: number; col: number }>;

    constructor(message: string, linePos?: Array<{ line: number; col: number }>) {
        super(message);
        this.name = 'YAMLParseError';
        this.linePos = linePos;
    }
}

export const parse = jest.fn((str: string) => {
    // First, try to parse as JSON (YAML is a superset of JSON)
    try {
        const trimmed = str.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(str);
        }
    } catch {
        // Not valid JSON, continue with YAML parsing
    }

    // Check for common YAML syntax errors
    const lines = str.split('\n');
    let prevIndent = 0;
    let prevLineEndsWithColon = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            continue;
        }

        // Check indentation consistency
        const indent = line.length - line.trimStart().length;

        // Bad indentation: increased indent when previous line didn't end with ':'
        // and we're not on a list item
        if (indent > prevIndent && !prevLineEndsWithColon && !trimmedLine.startsWith('-')) {
            throw new YAMLParseError(
                `Bad indentation at line ${i + 1}`,
                [{ line: i + 1, col: indent + 1 }]
            );
        }

        prevIndent = indent;
        prevLineEndsWithColon = trimmedLine.endsWith(':');
    }

    // Simple YAML-like object parsing for valid YAML
    const result: Record<string, unknown> = {};
    const objectStack: Array<{ obj: Record<string, unknown>; indent: number; key: string }> = [
        { obj: result, indent: -1, key: 'root' }
    ];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            continue;
        }

        const indent = line.length - line.trimStart().length;

        // Handle key: value pairs
        const colonIndex = trimmedLine.indexOf(':');
        if (colonIndex > 0) {
            const key = trimmedLine.substring(0, colonIndex).trim().replace(/^["']|["']$/g, '');
            const value = trimmedLine.substring(colonIndex + 1).trim();

            // Pop back to the correct parent based on indentation
            while (objectStack.length > 1 && objectStack[objectStack.length - 1].indent >= indent) {
                objectStack.pop();
            }

            const currentObject = objectStack[objectStack.length - 1].obj;

            if (value === '' ) {
                // Nested object - value will come on next lines
                const nestedObj: Record<string, unknown> = {};
                currentObject[key] = nestedObj;
                objectStack.push({ obj: nestedObj, indent, key });
            } else if (value === '{}') {
                // Empty object
                currentObject[key] = {};
            } else {
                // Simple value
                let parsedValue: unknown = value;
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    parsedValue = value.slice(1, -1);
                } else if (value === 'true') {
                    parsedValue = true;
                } else if (value === 'false') {
                    parsedValue = false;
                } else if (!isNaN(Number(value)) && value !== '') {
                    parsedValue = Number(value);
                }
                currentObject[key] = parsedValue;
            }
        }
    }

    return result;
});

export const stringify = jest.fn((obj: unknown) => {
    return JSON.stringify(obj, null, 2);
});

export default {
    parse,
    stringify,
    YAMLParseError
};
