import React from 'react';
import { useSelectionStore } from '../../core/stores/selectionStore';
import { InfoForm } from '../forms/InfoForm';
import { TagsSection } from '../forms/TagsSection';
import { PathsSection } from '../paths/PathsSection';
import { PlaceholderContent } from './PlaceholderContent';

/**
 * ContentRouter - Routes to the appropriate component based on navigation selection.
 *
 * This component reads the current selection from the selectionStore and
 * renders the appropriate form/editor:
 * - 'info' → InfoForm (title, version, description, contact, license)
 * - 'path' → PathsSection (all paths with search, view, edit)
 * - 'tag' → TagsSection (tag management)
 * - 'server' → ServerForm (later)
 * - 'component' → ComponentEditor (later)
 * - etc.
 */
export const ContentRouter: React.FC = () => {
    const { current } = useSelectionStore();

    // Route based on selection type
    switch (current.type) {
        case 'info':
            return <InfoForm />;

        case 'paths':
            // Parent "Paths" node selected - show all paths
            return <PathsSection />;

        case 'path':
            // Individual path selected - still show all paths
            // (PathsSection will handle highlighting the selected path later)
            return <PathsSection />;

        // Note: Tags section isn't in the navigation tree yet
        // We'll need to update treeBuilder.ts to add a "Tags" node

        case 'none':
        default:
            // Show InfoForm as default when nothing is selected
            return <InfoForm />;
    }
};
