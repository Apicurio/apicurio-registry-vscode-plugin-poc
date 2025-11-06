/**
 * Utilities for handling metadata (labels, names, descriptions) across entities.
 */

/**
 * Parse a label string in key=value format.
 * Supports values containing '=' by splitting only on the first occurrence.
 *
 * @param input Label string in format "key=value"
 * @returns Object with key and value, or null if invalid
 */
export function parseLabelInput(input: string): { key: string; value: string } | null {
    if (!input || !input.includes('=')) {
        return null;
    }

    const [key, ...valueParts] = input.split('=');
    const trimmedKey = key.trim();

    if (!trimmedKey || trimmedKey.length === 0) {
        return null;
    }

    const value = valueParts.join('=').trim();
    return { key: trimmedKey, value };
}

/**
 * Validate label input in key=value format.
 *
 * @param input Label string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateLabelInput(input: string): string | null {
    if (!input || input.trim().length === 0) {
        return 'Label cannot be empty';
    }

    if (!input.includes('=')) {
        return 'Label must be in format: key=value';
    }

    const parsed = parseLabelInput(input);
    if (!parsed) {
        return 'Label key cannot be empty';
    }

    return null;
}

/**
 * Check if a label key already exists in the labels object (case-sensitive).
 *
 * @param labels Existing labels
 * @param key Key to check
 * @returns True if key exists
 */
export function isDuplicateLabelKey(labels: Record<string, string>, key: string): boolean {
    return key in labels;
}

/**
 * Format labels for display in QuickPick or messages.
 * Returns a formatted string with each label on a new line.
 *
 * @param labels Labels object
 * @param indent Indentation string (default: "  ")
 * @returns Formatted string, or "(none)" if no labels
 */
export function formatLabelsForDisplay(labels: Record<string, string>, indent: string = '  '): string {
    const entries = Object.entries(labels);

    if (entries.length === 0) {
        return '(none)';
    }

    return entries
        .map(([key, value]) => `${indent}${key}=${value}`)
        .join('\n');
}

/**
 * Format labels as a bullet list for tooltips.
 *
 * @param labels Labels object
 * @returns Formatted string with bullet points, or empty string if no labels
 */
export function formatLabelsForTooltip(labels: Record<string, string>): string {
    const entries = Object.entries(labels);

    if (entries.length === 0) {
        return '';
    }

    return entries
        .map(([key, value]) => `• ${key}=${value}`)
        .join('\n');
}

/**
 * Get label count summary for tree view descriptions.
 *
 * @param labels Labels object
 * @returns Formatted string like "(3 labels)" or empty string if no labels
 */
export function getLabelCountDescription(labels: Record<string, string>): string {
    const count = Object.keys(labels).length;

    if (count === 0) {
        return '';
    }

    return `(${count} label${count === 1 ? '' : 's'})`;
}

/**
 * Merge new labels with existing labels.
 * New labels override existing ones with the same key.
 *
 * @param existingLabels Current labels
 * @param newLabels New labels to merge
 * @returns Merged labels object
 */
export function mergeLabels(
    existingLabels: Record<string, string>,
    newLabels: Record<string, string>
): Record<string, string> {
    return {
        ...existingLabels,
        ...newLabels
    };
}

/**
 * Remove a label by key.
 *
 * @param labels Labels object
 * @param keyToRemove Key to remove
 * @returns New labels object without the specified key
 */
export function removeLabel(labels: Record<string, string>, keyToRemove: string): Record<string, string> {
    const newLabels = { ...labels };
    delete newLabels[keyToRemove];
    return newLabels;
}

/**
 * Sort labels by key alphabetically.
 *
 * @param labels Labels object
 * @returns New labels object with sorted keys
 */
export function sortLabels(labels: Record<string, string>): Record<string, string> {
    const sortedKeys = Object.keys(labels).sort();
    const sorted: Record<string, string> = {};

    for (const key of sortedKeys) {
        sorted[key] = labels[key];
    }

    return sorted;
}

/**
 * Convert labels to Registry API format.
 * The API expects labels in a specific structure with additionalData field.
 *
 * @param labels Labels as Record<string, string>
 * @returns Labels in API format
 */
export function labelsToApiFormat(labels: Record<string, string>): { additionalData: Record<string, string> } {
    return {
        additionalData: labels
    };
}

/**
 * Convert labels from Registry API format to simple Record.
 *
 * @param apiLabels Labels from API response
 * @returns Labels as Record<string, string>
 */
export function labelsFromApiFormat(apiLabels: { additionalData?: Record<string, string> } | undefined): Record<string, string> {
    return apiLabels?.additionalData || {};
}

/**
 * Metadata that can be edited for different entity types.
 */
export interface EditableMetadata {
    name?: string;
    description?: string;
    labels?: Record<string, string>;
}

/**
 * Validate metadata before update.
 *
 * @param metadata Metadata to validate
 * @param entityType Type of entity (for context in error messages)
 * @returns Error message if invalid, null if valid
 */
export function validateMetadata(
    metadata: EditableMetadata,
    entityType: 'group' | 'artifact' | 'version'
): string | null {
    // Name validation (artifacts and versions only)
    if (metadata.name !== undefined) {
        if (metadata.name.trim().length === 0) {
            return 'Name cannot be empty';
        }
        if (metadata.name.trim().length < 2) {
            return 'Name must be at least 2 characters';
        }
    }

    // Description validation (optional for all types)
    if (metadata.description !== undefined && metadata.description.trim().length > 0) {
        if (metadata.description.trim().length < 2) {
            return 'Description must be at least 2 characters';
        }
    }

    // Labels validation
    if (metadata.labels !== undefined) {
        const keys = Object.keys(metadata.labels);
        const uniqueKeys = new Set(keys);

        if (keys.length !== uniqueKeys.size) {
            return 'Duplicate label keys are not allowed';
        }

        for (const [key, value] of Object.entries(metadata.labels)) {
            if (key.trim().length === 0) {
                return 'Label key cannot be empty';
            }
            // Note: Empty values are allowed (matches web UI behavior)
        }
    }

    return null;
}

/**
 * Check if metadata has any changes compared to original.
 *
 * @param original Original metadata
 * @param modified Modified metadata
 * @returns True if there are changes
 */
export function hasMetadataChanges(
    original: EditableMetadata,
    modified: EditableMetadata
): boolean {
    // Check name change
    if (original.name !== modified.name) {
        return true;
    }

    // Check description change
    if (original.description !== modified.description) {
        return true;
    }

    // Check labels change
    const originalLabels = original.labels || {};
    const modifiedLabels = modified.labels || {};

    const originalKeys = Object.keys(originalLabels).sort();
    const modifiedKeys = Object.keys(modifiedLabels).sort();

    // Different number of labels
    if (originalKeys.length !== modifiedKeys.length) {
        return true;
    }

    // Different keys or values
    for (const key of originalKeys) {
        if (originalLabels[key] !== modifiedLabels[key]) {
            return true;
        }
    }

    return false;
}
