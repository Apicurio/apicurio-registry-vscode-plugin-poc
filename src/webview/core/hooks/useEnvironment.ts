import { useContext } from 'react';
import { EnvironmentContext } from '../context/EnvironmentContext';
import { IEditorEnvironment } from '../interfaces/IEditorEnvironment';

/**
 * React hook to access the current editor environment.
 *
 * This hook provides access to environment-specific operations
 * without coupling components to a specific environment (VSCode vs Web).
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const env = useEnvironment();
 *
 *   const handleSave = async () => {
 *     await env.writeFile(uri, content);
 *     env.showInfo('Saved successfully!');
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * };
 * ```
 *
 * @throws Error if used outside of EnvironmentProvider
 * @returns The current editor environment
 */
export function useEnvironment(): IEditorEnvironment {
    const environment = useContext(EnvironmentContext);

    if (!environment) {
        throw new Error(
            'useEnvironment must be used within an EnvironmentProvider. ' +
            'Make sure your component tree is wrapped with <EnvironmentProvider>.'
        );
    }

    return environment;
}
