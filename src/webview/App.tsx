import React from 'react';
import { EditorLayout } from './components/layout/EditorLayout';
import { PlaceholderContent } from './components/content/PlaceholderContent';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This is the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 *
 * The app uses a 3-column layout:
 * - Left: Navigation tree (will be implemented in Subtask 2)
 * - Center: Main content area (forms and editors)
 * - Right: Properties panel (will be implemented later)
 */
const App: React.FC = () => {
    return (
        <EditorLayout
            navigationPanel={
                <div style={{ padding: '1rem' }}>
                    <p>Navigation Tree</p>
                    <p style={{ fontSize: '0.9em', color: 'var(--pf-v5-global--Color--200)' }}>
                        (Subtask 2)
                    </p>
                </div>
            }
            mainContent={<PlaceholderContent />}
            propertiesPanel={
                <div>
                    <p>Properties Panel</p>
                    <p style={{ fontSize: '0.9em', color: 'var(--pf-v5-global--Color--200)' }}>
                        (Later subtasks)
                    </p>
                </div>
            }
        />
    );
};

export default App;
