import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  TextInput,
} from '@patternfly/react-core';

/**
 * InputDialog - Reusable text input modal.
 *
 * Replaces window.prompt() which doesn't work in sandboxed webviews.
 */
export interface InputDialogProps {
  isOpen: boolean;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  label,
  initialValue = '',
  placeholder = '',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    onConfirm(value.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      handleConfirm();
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <Form>
        <FormGroup label={label} fieldId="input-value">
          <TextInput
            id="input-value"
            value={value}
            onChange={(_, val) => setValue(val)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoFocus
          />
        </FormGroup>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isDisabled={!value.trim()}
          >
            {confirmLabel}
          </Button>
          <Button variant="link" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
