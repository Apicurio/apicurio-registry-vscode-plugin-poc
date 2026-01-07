import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { ErrorHandlerService } from '../errorHandlerService';
import { ApicurioError, NetworkError, ValidationError } from '../../errors/apicurioErrors';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;
    let mockOutputChannel: {
        name: string;
        appendLine: jest.Mock;
        append: jest.Mock;
        show: jest.Mock;
        clear: jest.Mock;
        dispose: jest.Mock;
        hide: jest.Mock;
        replace: jest.Mock;
    };

    let showErrorMessageSpy: jest.SpiedFunction<typeof vscode.window.showErrorMessage>;
    let showWarningMessageSpy: jest.SpiedFunction<typeof vscode.window.showWarningMessage>;
    let showInformationMessageSpy: jest.SpiedFunction<typeof vscode.window.showInformationMessage>;
    let createOutputChannelSpy: jest.SpiedFunction<typeof vscode.window.createOutputChannel>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock output channel
        mockOutputChannel = {
            name: 'Apicurio Registry',
            appendLine: jest.fn(),
            append: jest.fn(),
            show: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn(),
            hide: jest.fn(),
            replace: jest.fn()
        };

        createOutputChannelSpy = jest.spyOn(vscode.window, 'createOutputChannel')
            .mockReturnValue(mockOutputChannel as any);

        showErrorMessageSpy = jest.spyOn(vscode.window, 'showErrorMessage')
            .mockResolvedValue(undefined as any);

        showWarningMessageSpy = jest.spyOn(vscode.window, 'showWarningMessage')
            .mockResolvedValue(undefined as any);

        showInformationMessageSpy = jest.spyOn(vscode.window, 'showInformationMessage')
            .mockResolvedValue(undefined as any);

        service = new ErrorHandlerService();
    });

    afterEach(() => {
        service.dispose();
        jest.restoreAllMocks();
    });

    describe('initialization', () => {
        it('should create output channel on initialization', () => {
            expect(createOutputChannelSpy).toHaveBeenCalledWith('Apicurio Registry');
        });
    });

    describe('handleError', () => {
        it('should log error to output channel', async () => {
            const error = new ApicurioError('TEST_ERROR', 'Test error');

            await service.handleError(error);

            expect(mockOutputChannel.appendLine).toHaveBeenCalled();
            const loggedMessage = mockOutputChannel.appendLine.mock.calls[0][0];
            expect(loggedMessage).toContain('TEST_ERROR');
            expect(loggedMessage).toContain('Test error');
        });

        it('should show error message to user', async () => {
            const error = new ApicurioError('TEST_ERROR', 'Test error', 'User-friendly message');

            await service.handleError(error);

            expect(showErrorMessageSpy).toHaveBeenCalledWith(
                'User-friendly message',
                'Show Details'
            );
        });

        it('should handle generic Error objects', async () => {
            const error = new Error('Generic error');

            await service.handleError(error);

            expect(showErrorMessageSpy).toHaveBeenCalled();
            expect(mockOutputChannel.appendLine).toHaveBeenCalled();
        });

        it('should handle string errors', async () => {
            await service.handleError('String error message');

            expect(showErrorMessageSpy).toHaveBeenCalledWith(
                'String error message',
                'Show Details'
            );
        });

        it('should show output channel when "Show Details" is clicked', async () => {
            showErrorMessageSpy.mockResolvedValue('Show Details' as any);

            const error = new ApicurioError('TEST_ERROR', 'Test error');
            await service.handleError(error);

            expect(mockOutputChannel.show).toHaveBeenCalled();
        });

        it('should include timestamp in log', async () => {
            const error = new ApicurioError('TEST_ERROR', 'Test error');

            await service.handleError(error);

            const loggedMessage = mockOutputChannel.appendLine.mock.calls[0][0];
            // Should contain ISO-like timestamp format
            expect(loggedMessage).toMatch(/\d{4}-\d{2}-\d{2}/);
        });

        it('should log stack trace if available', async () => {
            const error = new Error('Error with stack');

            await service.handleError(error);

            const calls = mockOutputChannel.appendLine.mock.calls;
            const allLogs = calls.map((c: unknown[]) => c[0]).join('\n');
            expect(allLogs).toContain('Stack');
        });
    });

    describe('handleWarning', () => {
        it('should show warning message to user', async () => {
            await service.handleWarning('Warning message');

            expect(showWarningMessageSpy).toHaveBeenCalledWith('Warning message');
        });

        it('should log warning to output channel', async () => {
            await service.handleWarning('Warning message');

            const loggedMessage = mockOutputChannel.appendLine.mock.calls[0][0];
            expect(loggedMessage).toContain('WARNING');
            expect(loggedMessage).toContain('Warning message');
        });
    });

    describe('handleInfo', () => {
        it('should show info message to user', async () => {
            await service.handleInfo('Info message');

            expect(showInformationMessageSpy).toHaveBeenCalledWith('Info message');
        });
    });

    describe('log', () => {
        it('should log message to output channel without showing to user', () => {
            service.log('Debug message');

            expect(mockOutputChannel.appendLine).toHaveBeenCalled();
            expect(showErrorMessageSpy).not.toHaveBeenCalled();
            expect(showWarningMessageSpy).not.toHaveBeenCalled();
            expect(showInformationMessageSpy).not.toHaveBeenCalled();
        });
    });

    describe('error classification', () => {
        it('should classify NetworkError correctly', async () => {
            const error = new NetworkError('Connection failed', 500);

            await service.handleError(error);

            const loggedMessage = mockOutputChannel.appendLine.mock.calls[0][0];
            expect(loggedMessage).toContain('NETWORK_ERROR');
        });

        it('should classify ValidationError correctly', async () => {
            const error = new ValidationError('artifactId', 'Required');

            await service.handleError(error);

            const loggedMessage = mockOutputChannel.appendLine.mock.calls[0][0];
            expect(loggedMessage).toContain('VALIDATION_ERROR');
        });
    });

    describe('dispose', () => {
        it('should dispose output channel', () => {
            service.dispose();

            expect(mockOutputChannel.dispose).toHaveBeenCalled();
        });
    });

    describe('showOutputChannel', () => {
        it('should show output channel', () => {
            service.showOutputChannel();

            expect(mockOutputChannel.show).toHaveBeenCalled();
        });
    });

    describe('clearLog', () => {
        it('should clear output channel', () => {
            service.clearLog();

            expect(mockOutputChannel.clear).toHaveBeenCalled();
        });
    });
});
