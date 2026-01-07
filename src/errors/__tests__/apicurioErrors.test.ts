import { describe, it, expect } from '@jest/globals';
import {
    ApicurioError,
    NetworkError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    OperationError
} from '../apicurioErrors';

describe('ApicurioError', () => {
    it('should create error with code and message', () => {
        const error = new ApicurioError('TEST_ERROR', 'Test error message');

        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe('TEST_ERROR');
        expect(error.message).toBe('Test error message');
        expect(error.userMessage).toBe('Test error message');
    });

    it('should allow custom user message', () => {
        const error = new ApicurioError(
            'TEST_ERROR',
            'Technical error details',
            'Something went wrong, please try again'
        );

        expect(error.message).toBe('Technical error details');
        expect(error.userMessage).toBe('Something went wrong, please try again');
    });

    it('should include timestamp', () => {
        const before = Date.now();
        const error = new ApicurioError('TEST_ERROR', 'Test');
        const after = Date.now();

        expect(error.timestamp).toBeGreaterThanOrEqual(before);
        expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it('should support optional cause', () => {
        const cause = new Error('Original error');
        const error = new ApicurioError('TEST_ERROR', 'Wrapper error', undefined, cause);

        expect(error.cause).toBe(cause);
    });
});

describe('NetworkError', () => {
    it('should create network error with status code', () => {
        const error = new NetworkError('Failed to connect', 500);

        expect(error).toBeInstanceOf(ApicurioError);
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Failed to connect');
    });

    it('should create network error without status code', () => {
        const error = new NetworkError('Connection timeout');

        expect(error.statusCode).toBeUndefined();
        expect(error.message).toBe('Connection timeout');
    });

    it('should generate appropriate user message for common status codes', () => {
        const error401 = new NetworkError('Unauthorized', 401);
        expect(error401.userMessage.toLowerCase()).toContain('authentication');

        const error403 = new NetworkError('Forbidden', 403);
        expect(error403.userMessage.toLowerCase()).toContain('permission');

        const error404 = new NetworkError('Not found', 404);
        expect(error404.userMessage.toLowerCase()).toContain('not found');

        const error500 = new NetworkError('Server error', 500);
        expect(error500.userMessage.toLowerCase()).toContain('server');
    });
});

describe('ValidationError', () => {
    it('should create validation error with field name', () => {
        const error = new ValidationError('artifactId', 'Artifact ID is required');

        expect(error).toBeInstanceOf(ApicurioError);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.field).toBe('artifactId');
        expect(error.message).toBe('Artifact ID is required');
    });

    it('should include field in user message', () => {
        const error = new ValidationError('version', 'Invalid version format');

        expect(error.userMessage).toContain('version');
    });

    it('should support validation without specific field', () => {
        const error = new ValidationError(undefined, 'Invalid input');

        expect(error.field).toBeUndefined();
        expect(error.message).toBe('Invalid input');
    });
});

describe('NotFoundError', () => {
    it('should create not found error with resource type', () => {
        const error = new NotFoundError('artifact', 'my-artifact');

        expect(error).toBeInstanceOf(ApicurioError);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.resourceType).toBe('artifact');
        expect(error.resourceId).toBe('my-artifact');
    });

    it('should generate descriptive user message', () => {
        const error = new NotFoundError('group', 'my-group');

        expect(error.userMessage).toContain('group');
        expect(error.userMessage).toContain('my-group');
        expect(error.userMessage).toContain('not found');
    });
});

describe('AuthenticationError', () => {
    it('should create authentication error', () => {
        const error = new AuthenticationError('Token expired');

        expect(error).toBeInstanceOf(ApicurioError);
        expect(error.code).toBe('AUTH_ERROR');
        expect(error.message).toBe('Token expired');
    });

    it('should suggest re-authentication in user message', () => {
        const error = new AuthenticationError('Invalid credentials');

        expect(error.userMessage.toLowerCase()).toMatch(/authenticate|login|credentials/);
    });
});

describe('OperationError', () => {
    it('should create operation error with operation name', () => {
        const error = new OperationError('deleteArtifact', 'Cannot delete artifact with versions');

        expect(error).toBeInstanceOf(ApicurioError);
        expect(error.code).toBe('OPERATION_ERROR');
        expect(error.operation).toBe('deleteArtifact');
        expect(error.message).toBe('Cannot delete artifact with versions');
    });

    it('should include operation in user message', () => {
        const error = new OperationError('createVersion', 'Version already exists');

        expect(error.userMessage).toContain('createVersion');
    });
});
