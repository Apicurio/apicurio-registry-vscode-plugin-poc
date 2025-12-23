/**
 * Visual Editor Entry Point
 *
 * This is the entry point for the visual editor webview.
 * It mounts the React app into the DOM.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { VisualEditorApp } from './VisualEditorApp';

// Import PatternFly CSS (required by @apicurio/openapi-editor)
import '@patternfly/react-core/dist/styles/base.css';

// Import OpenAPI Editor CSS - use direct path since it's not exported
import '../../../node_modules/@apicurio/openapi-editor/dist/openapi-editor.css';

// Mount the app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <VisualEditorApp />
        </React.StrictMode>
    );
} else {
    console.error('Root element not found');
}
