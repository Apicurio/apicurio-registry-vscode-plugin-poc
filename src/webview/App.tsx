import React, { useEffect, useState } from 'react';
import { Button, Alert } from '@patternfly/react-core';
import { useEnvironment } from './core/hooks/useEnvironment';

/**
 * Main App component for Apicurio Visual Editor
 *
 * This will be the entry point for the React-based visual editor
 * for OpenAPI/AsyncAPI specifications.
 */
const App: React.FC = () => {
    const env = useEnvironment();
    const [theme, setTheme] = useState(env.getTheme());
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Listen for theme changes
        const dispose = env.onThemeChange((newTheme) => {
            setTheme(newTheme);
            setMessage(`Theme changed to: ${newTheme}`);
        });

        // Cleanup
        return dispose;
    }, [env]);

    const handleTestNotification = () => {
        env.showInfo('Environment abstraction working! ✅');
        setMessage('Info notification sent to VSCode');
    };

    const handleTestWarning = () => {
        env.showWarning('This is a test warning');
        setMessage('Warning notification sent to VSCode');
    };

    const handleTestError = () => {
        env.showError('This is a test error');
        setMessage('Error notification sent to VSCode');
    };

    return (
        <div className="apicurio-editor" style={{ padding: '20px' }}>
            <h1>Apicurio Visual Editor</h1>

            <Alert variant="success" isInline title="Setup Complete!">
                React + Vite + PatternFly + TypeScript + Environment Abstraction Layer ✅
            </Alert>

            <div style={{ marginTop: '20px' }}>
                <h2>Current Theme: {theme}</h2>
                <p>The editor automatically detects VSCode theme changes!</p>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Test Environment Abstraction:</h3>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <Button variant="primary" onClick={handleTestNotification}>
                        Test Info Notification
                    </Button>
                    <Button variant="warning" onClick={handleTestWarning}>
                        Test Warning
                    </Button>
                    <Button variant="danger" onClick={handleTestError}>
                        Test Error
                    </Button>
                </div>
            </div>

            {message && (
                <div style={{ marginTop: '20px' }}>
                    <Alert variant="info" isInline title="Action">
                        {message}
                    </Alert>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>✅ Vite + React + PatternFly setup</li>
                    <li>✅ Environment abstraction layer (IEditorEnvironment)</li>
                    <li>⏳ Webview provider implementation</li>
                    <li>⏳ @apicurio/data-models integration</li>
                    <li>⏳ Zustand state management</li>
                    <li>⏳ Command pattern (undo/redo)</li>
                </ul>
            </div>
        </div>
    );
};

export default App;
