import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { EnvironmentProvider } from './core/context/EnvironmentContext';
import { VSCodeEnvironment } from './vscode/adapters/VSCodeEnvironment';
import './vscode/theme/patternfly-vscode-theme.css';
import '@patternfly/react-core/dist/styles/base.css';

// Create environment instance (VSCode-specific)
const environment = new VSCodeEnvironment();

// Send ready message to extension
environment.postMessage({ type: 'ready' });

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

// Create React root and render the app with Environment Provider
const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <EnvironmentProvider environment={environment}>
            <App />
        </EnvironmentProvider>
    </React.StrictMode>
);
