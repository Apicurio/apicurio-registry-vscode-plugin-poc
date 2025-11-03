import React from 'react';
import { Button } from '@patternfly/react-core';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This will be the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 */
const App: React.FC = () => {
    return (
        <div className="apicurio-editor">
            <h1>Apicurio Visual Editor</h1>
            <p>React + Vite + PatternFly + TypeScript Setup Complete! 🎉</p>
            <Button variant="primary">Test PatternFly Button</Button>
        </div>
    );
};

export default App;
