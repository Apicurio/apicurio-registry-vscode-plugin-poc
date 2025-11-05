import React from 'react';
import { EditorLayout } from './components/layout/EditorLayout';
import { NavigationTree } from './components/navigation/NavigationTree';
import { ProblemDrawer } from './components/problems/ProblemDrawer';
import { ContentRouter } from './components/content/ContentRouter';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This is the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 *
 * The app uses a 3-column layout with bottom panel:
 * - Left: Navigation tree (hierarchical document structure)
 * - Center: Main content area (routed based on navigation selection)
 * - Right: Properties panel (will be implemented later)
 * - Bottom: Problems panel (validation errors, warnings, info)
 */
const App: React.FC = () => {
    return (
        <EditorLayout
            navigationPanel={<NavigationTree />}
            mainContent={<ContentRouter />}
            propertiesPanel={
                <div>
                    <p>Properties Panel</p>
                    <p style={{ fontSize: '0.9em', color: 'var(--pf-v5-global--Color--200)' }}>
                        (Later subtasks)
                    </p>
                </div>
            }
            problemsPanel={<ProblemDrawer />}
        />
    );
};

export default App;
