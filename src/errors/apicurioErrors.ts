/**
 * Base error class for all Apicurio Registry errors.
 * Provides structured error information with codes, user-friendly messages, and timestamps.
 */
export class ApicurioError extends Error {
    public readonly code: string;
    public readonly userMessage: string;
    public readonly timestamp: number;
    public readonly cause?: Error;

    constructor(code: string, message: string, userMessage?: string, cause?: Error) {
        super(message);
        this.name = 'ApicurioError';
        this.code = code;
        this.userMessage = userMessage || message;
        this.timestamp = Date.now();
        this.cause = cause;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApicurioError);
        }
    }
}

/**
 * Error for network/API communication failures.
 */
export class NetworkError extends ApicurioError {
    public readonly statusCode?: number;

    constructor(message: string, statusCode?: number, cause?: Error) {
        const userMessage = NetworkError.getUserMessage(message, statusCode);
        super('NETWORK_ERROR', message, userMessage, cause);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }

    private static getUserMessage(message: string, statusCode?: number): string {
        if (statusCode === 401) {
            return 'Authentication failed. Please check your credentials and try again.';
        }
        if (statusCode === 403) {
            return 'You do not have permission to perform this operation.';
        }
        if (statusCode === 404) {
            return 'The requested resource was not found.';
        }
        if (statusCode && statusCode >= 500) {
            return 'The server encountered an error. Please try again later.';
        }
        return message;
    }
}

/**
 * Error for input validation failures.
 */
export class ValidationError extends ApicurioError {
    public readonly field?: string;

    constructor(field: string | undefined, message: string, cause?: Error) {
        const userMessage = field
            ? `Invalid ${field}: ${message}`
            : message;
        super('VALIDATION_ERROR', message, userMessage, cause);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Error for missing resources.
 */
export class NotFoundError extends ApicurioError {
    public readonly resourceType: string;
    public readonly resourceId: string;

    constructor(resourceType: string, resourceId: string, cause?: Error) {
        const message = `${resourceType} '${resourceId}' not found`;
        const userMessage = `The ${resourceType} '${resourceId}' was not found. It may have been deleted or you may not have access.`;
        super('NOT_FOUND', message, userMessage, cause);
        this.name = 'NotFoundError';
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}

/**
 * Error for authentication/authorization failures.
 */
export class AuthenticationError extends ApicurioError {
    constructor(message: string, cause?: Error) {
        const userMessage = 'Authentication failed. Please check your credentials and try to login again.';
        super('AUTH_ERROR', message, userMessage, cause);
        this.name = 'AuthenticationError';
    }
}

/**
 * Error for operation failures.
 */
export class OperationError extends ApicurioError {
    public readonly operation: string;

    constructor(operation: string, message: string, cause?: Error) {
        const userMessage = `Operation '${operation}' failed: ${message}`;
        super('OPERATION_ERROR', message, userMessage, cause);
        this.name = 'OperationError';
        this.operation = operation;
    }
}
