 
import { useState } from 'react';
import {
  Stack,
  TextInput,
  Select,
  Checkbox,
  Group,
  NumberInput,
  Textarea,
  Text,
  Box,
  Pill,
  ActionIcon,
  Collapse,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconPlus } from '@tabler/icons-react';
import type { CustomFieldDefinition, CustomFieldType } from '../../types/entities';

interface CustomFieldDefinitionInputProps {
  value: CustomFieldDefinition;
  onChange: (value: CustomFieldDefinition) => void;
  disabled?: boolean;
}

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string; description: string }[] = [
  { value: 'text', label: 'Short Text', description: 'Single line text input' },
  { value: 'long-text', label: 'Long Text', description: 'Multi-line text area' },
  { value: 'number', label: 'Number', description: 'Numeric input with validation' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'checkbox', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'select', label: 'Single Select', description: 'Choose one option from a list' },
  { value: 'multi-select', label: 'Multi Select', description: 'Choose multiple options' },
  { value: 'url', label: 'URL', description: 'Web link with validation' },
  { value: 'person-reference', label: 'Person Reference', description: 'Reference to a ChurchTools person' },
];

export function CustomFieldDefinitionInput({
  value,
  onChange,
  disabled,
}: CustomFieldDefinitionInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newOption, setNewOption] = useState('');

  const handleChange = (field: keyof CustomFieldDefinition, newValue: unknown) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const handleValidationChange = (field: string, newValue: unknown) => {
    onChange({
      ...value,
      validation: {
        ...value.validation,
        [field]: newValue,
      },
    });
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    
    const currentOptions = value.options || [];
    if (currentOptions.includes(newOption)) {
      return; // Duplicate option
    }
    
    handleChange('options', [...currentOptions, newOption]);
    setNewOption('');
  };

  const removeOption = (optionToRemove: string) => {
    const currentOptions = value.options || [];
    handleChange('options', currentOptions.filter(opt => opt !== optionToRemove));
  };

  const needsOptions = value.type === 'select' || value.type === 'multi-select';
  const supportsValidation = ['text', 'long-text', 'number'].includes(value.type);

  return (
    <Stack gap="sm">
      <TextInput
        label="Field Name"
        placeholder="e.g., Serial Number, Warranty Expiry"
        required
        value={value.name}
        onChange={(e) => {
          handleChange('name', e.currentTarget.value);
        }}
        disabled={disabled}
      />

      <Select
        label="Field Type"
        placeholder="Select field type"
        required
        value={value.type}
        onChange={(val) => {
          handleChange('type', val as CustomFieldType);
        }}
        data={FIELD_TYPE_OPTIONS.map(opt => ({
          value: opt.value,
          label: opt.label,
        }))}
        disabled={disabled}
      />

      <Checkbox
        label="Required field"
        description="Users must provide a value for this field"
        checked={value.required}
        onChange={(e) => {
          handleChange('required', e.currentTarget.checked);
        }}
        disabled={disabled}
      />

      <Textarea
        label="Help Text"
        placeholder="Optional hint or description for this field"
        value={value.helpText || ''}
        onChange={(e) => {
          handleChange('helpText', e.currentTarget.value);
        }}
        disabled={disabled}
        rows={2}
      />

      {needsOptions && (
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Options
          </Text>
          <Stack gap="xs">
            <Group gap="xs">
              {value.options?.map((option) => (
                <Pill
                  key={option}
                  withRemoveButton
                  onRemove={() => {
                    removeOption(option);
                  }}
                  disabled={disabled}
                >
                  {option}
                </Pill>
              ))}
            </Group>
            <Group gap="xs">
              <TextInput
                placeholder="Add option..."
                value={newOption}
                onChange={(e) => {
                  setNewOption(e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
                disabled={disabled}
                style={{ flex: 1 }}
              />
              <ActionIcon
                onClick={addOption}
                disabled={!newOption.trim() || disabled}
                variant="light"
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Group>
          </Stack>
        </Box>
      )}

      {supportsValidation && (
        <>
          <Group justify="space-between" mt="xs">
            <Text size="sm" fw={500}>
              Advanced Validation
            </Text>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => {
                setShowAdvanced(!showAdvanced);
              }}
              disabled={disabled}
            >
              {showAdvanced ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={showAdvanced}>
            <Stack gap="xs" pl="md">
              {value.type === 'number' && (
                <>
                  <NumberInput
                    label="Minimum Value"
                    placeholder="No minimum"
                    value={value.validation?.min}
                    onChange={(val) => {
                      handleValidationChange('min', val);
                    }}
                    disabled={disabled}
                  />
                  <NumberInput
                    label="Maximum Value"
                    placeholder="No maximum"
                    value={value.validation?.max}
                    onChange={(val) => {
                      handleValidationChange('max', val);
                    }}
                    disabled={disabled}
                  />
                </>
              )}

              {(value.type === 'text' || value.type === 'long-text') && (
                <>
                  <NumberInput
                    label="Minimum Length"
                    placeholder="No minimum"
                    value={value.validation?.minLength}
                    onChange={(val) => {
                      handleValidationChange('minLength', val);
                    }}
                    disabled={disabled}
                    min={0}
                  />
                  <NumberInput
                    label="Maximum Length"
                    placeholder="No maximum"
                    value={value.validation?.maxLength}
                    onChange={(val) => {
                      handleValidationChange('maxLength', val);
                    }}
                    disabled={disabled}
                    min={0}
                  />
                  <TextInput
                    label="Pattern (Regex)"
                    placeholder="e.g., ^[A-Z]{3}-\d{4}$"
                    description="Advanced: Regular expression for validation"
                    value={value.validation?.pattern || ''}
                    onChange={(e) => {
                      handleValidationChange('pattern', e.currentTarget.value);
                    }}
                    disabled={disabled}
                  />
                </>
              )}
            </Stack>
          </Collapse>
        </>
      )}
    </Stack>
  );
}
