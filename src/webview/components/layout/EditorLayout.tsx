import React, { useState } from 'react';
import {
    Page,
    PageSection,
    Masthead,
    MastheadToggle,
    MastheadMain,
    MastheadContent,
    PageSidebar,
    PageSidebarBody,
    Drawer,
    DrawerContent,
    DrawerContentBody,
    DrawerPanelContent,
    DrawerHead,
    DrawerActions,
    DrawerCloseButton,
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    ToolbarGroup,
    Button,
    Label,
    Split,
    SplitItem,
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
 * Master layout component for the visual editor.
 *
 * Provides a 3-column layout:
 * - Left: Navigation tree (collapsible)
 * - Center: Main content area (forms)
 * - Right: Properties panel (collapsible)
 *
 * Features:
 * - Title bar with document info and validation status
 * - Quick actions toolbar (undo, redo, format)
 * - Collapsible side panels
 * - Responsive design
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

    /**
     * Masthead (title bar) component.
     */
    const masthead = (
        <Masthead>
            <MastheadToggle>
                <Button
                    variant="plain"
                    onClick={() => setIsNavOpen(!isNavOpen)}
                    aria-label="Toggle navigation"
                >
                    <BarsIcon />
                </Button>
            </MastheadToggle>

            <MastheadMain>
                <Split hasGutter>
                    <SplitItem>
                        <Title headingLevel="h1" size="md">
                            Apicurio Visual Editor
                        </Title>
                    </SplitItem>
                    {documentType && (
                        <SplitItem>
                            <Label color="blue">{documentType}</Label>
                        </SplitItem>
                    )}
                    {isDirty && (
                        <SplitItem>
                            <Label color="orange">Modified</Label>
                        </SplitItem>
                    )}
                    <SplitItem>
                        <Label color={validationStatus.color} icon={validationStatus.icon}>
                            {validationStatus.text}
                        </Label>
                    </SplitItem>
                </Split>
            </MastheadMain>

            <MastheadContent>
                <Toolbar isFullHeight isStatic>
                    <ToolbarContent>
                        <ToolbarGroup variant="icon-button-group">
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
                        </ToolbarGroup>

                        <ToolbarItem>
                            <Button
                                variant="plain"
                                icon={<CogIcon />}
                                onClick={() => setIsPropsPanelOpen(!isPropsPanelOpen)}
                                aria-label="Toggle properties panel"
                            />
                        </ToolbarItem>
                    </ToolbarContent>
                </Toolbar>
            </MastheadContent>
        </Masthead>
    );

    /**
     * Navigation sidebar (left panel).
     */
    const sidebar = (
        <PageSidebar isSidebarOpen={isNavOpen}>
            <PageSidebarBody>
                {navigationPanel || (
                    <div style={{ padding: '1rem' }}>
                        <p>Navigation tree will appear here</p>
                    </div>
                )}
            </PageSidebarBody>
        </PageSidebar>
    );

    /**
     * Properties panel (right drawer).
     */
    const propertiesDrawer = propertiesPanel && (
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
    );

    return (
        <Page masthead={masthead} sidebar={sidebar} isManagedSidebar>
            <PageSection variant="light" padding={{ default: 'noPadding' }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Drawer isExpanded={isPropsPanelOpen} isInline>
                    <DrawerContent panelContent={propertiesDrawer}>
                        <DrawerContentBody style={{ flex: 1, overflow: 'auto' }}>
                            {mainContent}
                        </DrawerContentBody>
                    </DrawerContent>
                </Drawer>
                {problemsPanel && (
                    <div style={{ borderTop: '1px solid var(--pf-v5-global--BorderColor--100)', maxHeight: '300px', overflow: 'auto' }}>
                        {problemsPanel}
                    </div>
                )}
            </PageSection>
        </Page>
    );
};
