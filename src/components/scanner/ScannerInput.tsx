import { useState } from 'react';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconBarcode, IconSearch } from '@tabler/icons-react';

interface ScannerInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  label?: string;
  buttonText?: string;
  autoFocus?: boolean;
}

/**
 * ScannerInput component - Manual entry fallback for barcode/QR scanning
 * 
 * Features:
 * - Text input for manual asset number entry
 * - Submit on Enter key or button click
 * - Auto-focus for quick entry
 * - Validation feedback
 */
 
export function ScannerInput({
  onScan,
  placeholder = 'Enter asset number...',
  label = 'Asset Number',
  buttonText = 'Lookup',
  autoFocus = true,
}: ScannerInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    
    if (trimmedValue.length === 0) {
      setError('Please enter an asset number');
      return;
    }

    if (trimmedValue.length < 3) {
      setError('Asset number too short');
      return;
    }

    setError(null);
    onScan(trimmedValue);
    setValue(''); // Clear input after successful scan
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
    if (error) {
      setError(null);
    }
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" align="flex-end" wrap="nowrap">
        <TextInput
          flex={1}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          error={error}
          leftSection={<IconBarcode size={16} />}
          autoFocus={autoFocus}
        />
        <Button
          leftSection={<IconSearch size={16} />}
          onClick={handleSubmit}
          disabled={value.trim().length === 0}
        >
          {buttonText}
        </Button>
      </Group>
      <Text size="xs" c="dimmed">
        Enter the asset number manually or scan with a barcode scanner
      </Text>
    </Stack>
  );
}
