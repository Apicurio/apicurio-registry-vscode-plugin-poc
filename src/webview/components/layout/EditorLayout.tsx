import React, { useState } from 'react';
import {
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    ToolbarGroup,
    Button,
    Label,
    Drawer,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    DrawerHead,
    DrawerActions,
    DrawerCloseButton,
    Title
} from '@patternfly/react-core';
import {
    BarsIcon,
    UndoIcon,
    RedoIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ExclamationCircleIcon,
    CogIcon
} from '@patternfly/react-icons';
import { useDocument } from '../../core/hooks/useDocument';
import { useValidationStore } from '../../core/stores/validationStore';
import { useCommandHistoryStore } from '../../core/stores/commandHistoryStore';
import './EditorLayout.css';

/**
 * Props for EditorLayout component.
 */
export interface EditorLayoutProps {
    /** Navigation panel content (tree view) */
    navigationPanel?: React.ReactNode;
    /** Main content area (forms, editors) */
    mainContent: React.ReactNode;
    /** Properties panel content (right sidebar) */
    propertiesPanel?: React.ReactNode;
    /** Problems panel content (bottom panel) */
    problemsPanel?: React.ReactNode;
}

/**
 * Custom layout component for the visual editor.
 *
 * Uses simple flexbox layout instead of PatternFly Page component.
 * Still uses individual PatternFly components (Toolbar, Drawer, etc.)
 */
export const EditorLayout: React.FC<EditorLayoutProps> = ({
    navigationPanel,
    mainContent,
    propertiesPanel,
    problemsPanel
}) => {
    const { documentType, isDirty } = useDocument();
    const { isValid, getErrorCount, getWarningCount } = useValidationStore();
    const { undo, redo, canUndo, canRedo, getUndoDescription, getRedoDescription } = useCommandHistoryStore();

    // Panel visibility state
    const [isNavOpen, setIsNavOpen] = useState(true);
    const [isPropsPanelOpen, setIsPropsPanelOpen] = useState(true);

    /**
     * Get validation status icon and color.
     */
    const getValidationStatus = () => {
        const errors = getErrorCount();
        const warnings = getWarningCount();

        if (errors > 0) {
            return {
                icon: <ExclamationCircleIcon />,
                color: 'red',
                text: `${errors} error${errors !== 1 ? 's' : ''}`
            };
        }

        if (warnings > 0) {
            return {
                icon: <ExclamationTriangleIcon />,
                color: 'orange',
                text: `${warnings} warning${warnings !== 1 ? 's' : ''}`
            };
        }

        return {
            icon: <CheckCircleIcon />,
            color: 'green',
            text: 'Valid'
        };
    };

    const validationStatus = getValidationStatus();

    return (
        <div className="apicurio-editor-layout">
            {/* Header/Toolbar */}
            <div className="apicurio-editor-header">
                <Toolbar isFullHeight>
                    <ToolbarContent>
                        {/* Left side - toggle and title */}
                        <ToolbarGroup>
                            <ToolbarItem>
                                <Button
                                    variant="plain"
                                    onClick={() => setIsNavOpen(!isNavOpen)}
                                    aria-label="Toggle navigation"
                                >
                                    <BarsIcon />
                                </Button>
                            </ToolbarItem>
                            <ToolbarItem>
                                <Title headingLevel="h1" size="md">
                                    Apicurio Visual Editor
                                </Title>
                            </ToolbarItem>
                            {documentType && (
                                <ToolbarItem>
                                    <Label color="blue">{documentType}</Label>
                                </ToolbarItem>
                            )}
                            {isDirty && (
                                <ToolbarItem>
                                    <Label color="orange">Modified</Label>
                                </ToolbarItem>
                            )}
                            <ToolbarItem>
                                <Label color={validationStatus.color} icon={validationStatus.icon}>
                                    {validationStatus.text}
                                </Label>
                            </ToolbarItem>
                        </ToolbarGroup>

                        {/* Right side - actions */}
                        <ToolbarGroup align={{ default: 'alignEnd' }}>
                            <ToolbarItem>
                                <Button
                                    variant="plain"
                                    icon={<UndoIcon />}
                                    isDisabled={!canUndo()}
                                    onClick={() => undo()}
                                    aria-label="Undo"
                                    title={getUndoDescription() || 'Nothing to undo'}
                                />
                            </ToolbarItem>
                            <ToolbarItem>
                                <Button
                                    variant="plain"
                                    icon={<RedoIcon />}
                                    isDisabled={!canRedo()}
                                    onClick={() => redo()}
                                    aria-label="Redo"
                                    title={getRedoDescription() || 'Nothing to redo'}
                                />
                            </ToolbarItem>
                            <ToolbarItem>
                                <Button
                                    variant="plain"
                                    icon={<CogIcon />}
                                    onClick={() => setIsPropsPanelOpen(!isPropsPanelOpen)}
                                    aria-label="Toggle properties panel"
                                />
                            </ToolbarItem>
                        </ToolbarGroup>
                    </ToolbarContent>
                </Toolbar>
            </div>

            {/* Body - Sidebar + Main + Properties */}
            <div className="apicurio-editor-body">
                {/* Left Sidebar (Navigation) */}
                {isNavOpen && (
                    <div className="apicurio-editor-sidebar">
                        {navigationPanel}
                    </div>
                )}

                {/* Main Content Area with Drawer for Properties */}
                <div className="apicurio-editor-main-wrapper">
                    <Drawer isExpanded={isPropsPanelOpen} isInline>
                        <DrawerContent
                            panelContent={
                                propertiesPanel && (
                                    <DrawerPanelContent isResizable defaultSize="400px" minSize="200px">
                                        <DrawerHead>
                                            <Title headingLevel="h2" size="md">
                                                Properties
                                            </Title>
                                            <DrawerActions>
                                                <DrawerCloseButton onClick={() => setIsPropsPanelOpen(false)} />
                                            </DrawerActions>
                                        </DrawerHead>
                                        <div style={{ padding: '1rem' }}>
                                            {propertiesPanel}
                                        </div>
                                    </DrawerPanelContent>
                                )
                            }
                        >
                            <DrawerContentBody className="apicurio-editor-main-content">
                                {mainContent}
                            </DrawerContentBody>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>

            {/* Problems Panel (Bottom) */}
            {problemsPanel && (
                <div className="apicurio-editor-problems">
                    {problemsPanel}
                </div>
            )}
        </div>
    );
};
