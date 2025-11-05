import React from 'react';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';

/**
 * ConfirmDialog - Reusable confirmation modal.
 *
 * Replaces window.confirm() which doesn't work in sandboxed webviews.
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <div style={{ marginBottom: '1rem' }}>{message}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button variant="link" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
};
