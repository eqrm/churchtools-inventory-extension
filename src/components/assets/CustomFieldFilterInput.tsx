 
import { Select, MultiSelect, TextInput, NumberInput } from '@mantine/core';
import type { CustomFieldDefinition } from '../../types/entities';

interface CustomFieldFilterInputProps {
  field: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CustomFieldFilterInput({
  field,
  value,
  onChange,
}: CustomFieldFilterInputProps) {
  const { type, name, options } = field;

  const commonProps = {
    label: name,
    placeholder: `Filter by ${name.toLowerCase()}`,
    clearable: true,
  };

  switch (type) {
    case 'text':
    case 'long-text':
    case 'url':
      return (
        <TextInput
          {...commonProps}
          value={(value as string) || ''}
          onChange={(e) => {
            onChange(e.currentTarget.value || undefined);
          }}
        />
      );

    case 'number':
      return (
        <NumberInput
          {...commonProps}
          value={(value as number) || undefined}
          onChange={(val) => {
            onChange(val || undefined);
          }}
        />
      );

    case 'select':
      return (
        <Select
          {...commonProps}
          value={(value as string) || null}
          onChange={(val) => {
            onChange(val || undefined);
          }}
          data={options || []}
        />
      );

    case 'multi-select':
      return (
        <MultiSelect
          {...commonProps}
          value={(value as string[] | undefined) || []}
          onChange={(vals) => {
            onChange(vals.length > 0 ? vals : undefined);
          }}
          data={options || []}
        />
      );

    case 'checkbox':
      return (
        <Select
          {...commonProps}
          value={typeof value === 'boolean' ? String(value) : null}
          onChange={(val) => {
            onChange(val === 'true' ? true : val === 'false' ? false : undefined);
          }}
          data={[
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ]}
        />
      );

    default:
      return (
        <TextInput
          {...commonProps}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => {
            onChange(e.currentTarget.value || undefined);
          }}
        />
      );
  }
}
