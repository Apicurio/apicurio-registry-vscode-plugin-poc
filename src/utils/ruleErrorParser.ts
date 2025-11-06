import * as vscode from 'vscode';

/**
 * Rule violation error details
 */
export interface RuleViolationError {
    ruleType: string;
    message: string;
    causes: Array<{
        description: string;
        context?: string;
    }>;
    suggestions: string[];
}

/**
 * Parse an error to check if it's a rule violation
 */
export function parseRuleViolation(error: any): RuleViolationError | null {
    // Check if this is a rule violation error (typically 409 Conflict or 400 Bad Request)
    if (!error.response) {
        return null;
    }

    const status = error.response.status;
    const data = error.response.data;

    if (!data || (status !== 409 && status !== 400)) {
        return null;
    }

    // Try to extract rule type from message
    const message = data.message || data.detail || '';
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    // Check if this is a rule violation
    if (!isRuleViolation(messageStr)) {
        return null;
    }

    // Extract rule type
    const ruleType = extractRuleType(messageStr);

    // Extract causes
    const causes = extractCauses(data);

    // Generate suggestions
    const suggestions = generateSuggestions(ruleType, messageStr);

    return {
        ruleType,
        message: messageStr,
        causes,
        suggestions
    };
}

/**
 * Check if error message indicates a rule violation
 */
function isRuleViolation(message: string): boolean {
    const ruleKeywords = [
        'validity',
        'compatibility',
        'integrity',
        'rule',
        'violation',
        'invalid schema',
        'not compatible',
        'reference',
        'duplicate'
    ];

    const lowerMessage = message.toLowerCase();
    return ruleKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extract rule type from error message
 */
function extractRuleType(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('validity')) {
        return 'VALIDITY';
    }
    if (lowerMessage.includes('compatibility') || lowerMessage.includes('compatible')) {
        return 'COMPATIBILITY';
    }
    if (lowerMessage.includes('integrity') || lowerMessage.includes('reference')) {
        return 'INTEGRITY';
    }

    return 'UNKNOWN';
}

/**
 * Extract violation causes from error data
 */
function extractCauses(data: any): Array<{ description: string; context?: string }> {
    const causes: Array<{ description: string; context?: string }> = [];

    // Try different error formats
    if (data.detail && typeof data.detail === 'object') {
        if (Array.isArray(data.detail.causes)) {
            data.detail.causes.forEach((cause: any) => {
                causes.push({
                    description: cause.description || cause.message || String(cause),
                    context: cause.context
                });
            });
        } else if (data.detail.message) {
            causes.push({ description: data.detail.message });
        }
    } else if (data.causes && Array.isArray(data.causes)) {
        data.causes.forEach((cause: any) => {
            causes.push({
                description: cause.description || cause.message || String(cause),
                context: cause.context
            });
        });
    } else if (data.error_description) {
        causes.push({ description: data.error_description });
    }

    // If no causes found, use the main message
    if (causes.length === 0 && data.message) {
        causes.push({ description: data.message });
    }

    return causes;
}

/**
 * Generate helpful suggestions based on rule type
 */
function generateSuggestions(ruleType: string, message: string): string[] {
    const suggestions: string[] = [];

    switch (ruleType) {
        case 'VALIDITY':
            suggestions.push('Check the schema syntax and structure');
            suggestions.push('Validate the schema using an online validator');
            suggestions.push('Disable the VALIDITY rule temporarily');
            break;

        case 'COMPATIBILITY':
            suggestions.push('Review the schema changes for breaking changes');
            if (message.toLowerCase().includes('backward')) {
                suggestions.push('Add removed fields back to maintain backward compatibility');
                suggestions.push('Use FORWARD compatibility instead');
            } else if (message.toLowerCase().includes('forward')) {
                suggestions.push('Avoid adding required fields to maintain forward compatibility');
                suggestions.push('Use BACKWARD compatibility instead');
            }
            suggestions.push('Disable the COMPATIBILITY rule temporarily');
            break;

        case 'INTEGRITY':
            suggestions.push('Ensure all referenced artifacts exist');
            suggestions.push('Check artifact reference names and versions');
            suggestions.push('Create the referenced artifacts first');
            break;

        default:
            suggestions.push('Review the error message details');
            suggestions.push('Check the configured rules for this artifact/group');
    }

    return suggestions;
}

/**
 * Show a user-friendly rule violation error dialog
 */
export async function showRuleViolationError(violation: RuleViolationError): Promise<void> {
    // Build detailed message
    const detailLines: string[] = [];
    detailLines.push(`**Rule Type:** ${violation.ruleType}`);
    detailLines.push('');
    detailLines.push(`**Error:** ${violation.message}`);
    detailLines.push('');

    if (violation.causes.length > 0) {
        detailLines.push('**Violation Details:**');
        violation.causes.forEach((cause, index) => {
            detailLines.push(`${index + 1}. ${cause.description}`);
            if (cause.context) {
                detailLines.push(`   Context: ${cause.context}`);
            }
        });
        detailLines.push('');
    }

    if (violation.suggestions.length > 0) {
        detailLines.push('**Suggestions:**');
        violation.suggestions.forEach((suggestion) => {
            detailLines.push(`• ${suggestion}`);
        });
    }

    const markdown = new vscode.MarkdownString(detailLines.join('\n'));
    markdown.isTrusted = true;

    // Show modal dialog with options
    const action = await vscode.window.showErrorMessage(
        `${violation.ruleType} Rule Violation`,
        {
            modal: true,
            detail: detailLines.join('\n')
        },
        'View Rules',
        'OK'
    );

    if (action === 'View Rules') {
        // Open rules management command
        vscode.commands.executeCommand('apicurioRegistry.manageGlobalRules');
    }
}

/**
 * Handle error and show rule violation if applicable
 */
export async function handlePotentialRuleViolation(error: any): Promise<boolean> {
    const violation = parseRuleViolation(error);

    if (violation) {
        await showRuleViolationError(violation);
        return true;
    }

    return false;
}
