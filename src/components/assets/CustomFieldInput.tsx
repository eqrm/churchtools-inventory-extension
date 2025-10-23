/* eslint-disable max-lines-per-function */
import {
  TextInput,
  Textarea,
  NumberInput,
  Checkbox,
  Select,
  MultiSelect,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { CustomFieldDefinition, CustomFieldValue } from '../../types/entities';

interface CustomFieldInputProps {
  field: CustomFieldDefinition;
  value: CustomFieldValue | undefined;
  onChange: (value: CustomFieldValue) => void;
  error?: string;
  disabled?: boolean;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: CustomFieldInputProps) {
  const { type, name, required, helpText, options, validation } = field;

  // Helper to validate input
  const getValidationProps = () => {
    const props: Record<string, unknown> = {};
    
    if (validation) {
      if (type === 'number') {
        if (validation.min !== undefined) props['min'] = validation.min;
        if (validation.max !== undefined) props['max'] = validation.max;
      }
      if (type === 'text' || type === 'long-text') {
        if (validation.minLength) props['minLength'] = validation.minLength;
        if (validation.maxLength) props['maxLength'] = validation.maxLength;
      }
    }
    
    return props;
  };

  const commonProps = {
    label: name,
    description: helpText,
    required,
    error,
    disabled,
    ...getValidationProps(),
  };

  switch (type) {
    case 'text':
      return (
        <TextInput
          {...commonProps}
          value={(value as string) || ''}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          placeholder={`Enter ${name.toLowerCase()}`}
        />
      );

    case 'long-text':
      return (
        <Textarea
          {...commonProps}
          value={(value as string) || ''}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          placeholder={`Enter ${name.toLowerCase()}`}
          rows={4}
        />
      );

    case 'number':
      return (
        <NumberInput
          {...commonProps}
          value={(value as number) || undefined}
          onChange={(val) => {
            onChange(typeof val === 'number' ? val : 0);
          }}
          placeholder={`Enter ${name.toLowerCase()}`}
        />
      );

    case 'date':
      return (
        <DateInput
          {...commonProps}
          value={value ? new Date(value as string) : undefined}
          onChange={(date) => {
            if (date) {
              onChange(date.toISOString());
            }
          }}
          placeholder={`Select ${name.toLowerCase()}`}
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          {...commonProps}
          checked={(value as boolean) || false}
          onChange={(e) => {
            onChange(e.currentTarget.checked);
          }}
        />
      );

    case 'select':
      return (
        <Select
          {...commonProps}
          value={(value as string) || null}
          onChange={(val) => {
            if (val) {
              onChange(val);
            }
          }}
          data={options || []}
          placeholder={`Select ${name.toLowerCase()}`}
          clearable={!required}
        />
      );

    case 'multi-select':
      return (
        <MultiSelect
          {...commonProps}
          value={(value as string[] | undefined) || []}
          onChange={(vals) => {
            onChange(vals);
          }}
          data={options || []}
          placeholder={`Select ${name.toLowerCase()}`}
          clearable
        />
      );

    case 'url':
      return (
        <TextInput
          {...commonProps}
          type="url"
          value={(value as string) || ''}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          placeholder="https://example.com"
        />
      );

    case 'person-reference':
      // TODO: Implement person search/select when person API is available (Phase 9)
      return (
        <TextInput
          {...commonProps}
          value={(value as string) || ''}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          placeholder="Person ID (search coming in Phase 9)"
          description="Note: Person search will be implemented in Phase 9"
        />
      );

    default:
      return (
        <TextInput
          {...commonProps}
          value={String(value || '')}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
          placeholder={`Enter ${name.toLowerCase()}`}
        />
      );
  }
}
