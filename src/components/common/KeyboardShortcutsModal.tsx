import { Modal, Stack, Group, Text, Kbd, Title, Divider, SimpleGrid } from '@mantine/core';
import { IconKeyboard } from '@tabler/icons-react';

interface KeyboardShortcutsModalProps {
  opened: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Global Shortcuts
  {
    keys: ['Alt', 'S'],
    description: 'Open quick scanner (Windows/Linux)',
    category: 'Global',
  },
  {
    keys: ['⌘', 'S'],
    description: 'Open quick scanner (macOS)',
    category: 'Global',
  },
  {
    keys: ['Esc'],
    description: 'Close modals and drawers',
    category: 'Global',
  },
  
  // Navigation
  {
    keys: ['Tab'],
    description: 'Navigate between form fields',
    category: 'Navigation',
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Navigate backwards between fields',
    category: 'Navigation',
  },
  {
    keys: ['Enter'],
    description: 'Submit forms or confirm actions',
    category: 'Navigation',
  },
  {
    keys: ['↑', '↓'],
    description: 'Navigate table rows',
    category: 'Navigation',
  },
  
  // Tables
  {
    keys: ['Click'],
    description: 'View item details',
    category: 'Tables',
  },
  {
    keys: ['⋮', 'Menu'],
    description: 'Open item actions menu',
    category: 'Tables',
  },
  
  // Forms
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Quick save (when in form)',
    category: 'Forms',
  },
  {
    keys: ['⌘', 'Enter'],
    description: 'Quick save (macOS)',
    category: 'Forms',
  },
];

/**
 * Keyboard Shortcuts Documentation Modal
 * T226: Display all available keyboard shortcuts
 */
export function KeyboardShortcutsModal({ opened, onClose }: KeyboardShortcutsModalProps) {
  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconKeyboard size={20} />
          <Title order={3}>Keyboard Shortcuts</Title>
        </Group>
      }
      size="lg"
    >
      <Stack gap="xl">
        {categories.map(category => (
          <div key={category}>
            <Title order={4} size="h5" mb="md">
              {category}
            </Title>
            <Stack gap="xs">
              {shortcuts
                .filter(s => s.category === category)
                .map((shortcut, index) => (
                  <Group key={`${category}-${index}`} justify="space-between">
                    <Text size="sm">{shortcut.description}</Text>
                    <Group gap={4}>
                      {shortcut.keys.map((key, keyIndex) => (
                        <Group key={keyIndex} gap={4}>
                          <Kbd>{key}</Kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <Text size="xs" c="dimmed">+</Text>
                          )}
                        </Group>
                      ))}
                    </Group>
                  </Group>
                ))}
            </Stack>
            {category !== categories[categories.length - 1] && (
              <Divider my="md" />
            )}
          </div>
        ))}
        
        <Divider />
        
        <Stack gap="xs">
          <Title order={5} size="h6">Scanner Modes</Title>
          <SimpleGrid cols={1} spacing="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Keyboard Mode</Text>
              <Text size="sm">USB/Bluetooth barcode scanner</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Camera Mode</Text>
              <Text size="sm">Use device camera for QR codes</Text>
            </Group>
          </SimpleGrid>
        </Stack>
      </Stack>
    </Modal>
  );
}
