import React, { createContext, ReactNode } from 'react';
import { IEditorEnvironment } from '../interfaces/IEditorEnvironment';

/**
 * React Context for providing the editor environment to all components.
 */
export const EnvironmentContext = createContext<IEditorEnvironment | null>(null);

/**
 * Props for EnvironmentProvider component.
 */
export interface EnvironmentProviderProps {
    /** The environment implementation to provide */
    environment: IEditorEnvironment;
    /** Child components */
    children: ReactNode;
}

/**
 * Provider component that injects the environment into the React component tree.
 *
 * This should wrap the entire editor application.
 *
 * @example
 * ```tsx
 * import { VSCodeEnvironment } from './vscode/adapters/VSCodeEnvironment';
 * import { EnvironmentProvider } from './core/context/EnvironmentContext';
 *
 * const environment = new VSCodeEnvironment();
 *
 * root.render(
 *   <EnvironmentProvider environment={environment}>
 *     <App />
 *   </EnvironmentProvider>
 * );
 * ```
 */
export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({
    environment,
    children
}) => {
    return (
        <EnvironmentContext.Provider value={environment}>
            {children}
        </EnvironmentContext.Provider>
    );
};
