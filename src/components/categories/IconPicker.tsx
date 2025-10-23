import { useState, forwardRef } from 'react';
import {
  ActionIcon,
  Popover,
  TextInput,
  Group,
  SimpleGrid,
  Text,
  Box,
  ScrollArea,
} from '@mantine/core';
import {
  IconMicrophone,
  IconDeviceTv,
  IconBulb,
  IconCamera,
  IconMusic,
  IconHeadphones,
  IconDeviceSpeaker,
  IconPlugConnected,
  IconWifi,
  IconRouter,
  IconDeviceLaptop,
  IconDeviceDesktop,
  IconKeyboard,
  IconMouse,
  IconPrinter,
  IconPresentation,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react';

// Common icons for inventory categories
const COMMON_ICONS = [
  { Icon: IconMicrophone, name: 'Microphone' },
  { Icon: IconDeviceTv, name: 'TV/Display' },
  { Icon: IconBulb, name: 'Lighting' },
  { Icon: IconCamera, name: 'Camera' },
  { Icon: IconMusic, name: 'Music' },
  { Icon: IconHeadphones, name: 'Headphones' },
  { Icon: IconDeviceSpeaker, name: 'Speaker' },
  { Icon: IconPlugConnected, name: 'Connector' },
  { Icon: IconWifi, name: 'Cable' },
  { Icon: IconRouter, name: 'Network' },
  { Icon: IconDeviceLaptop, name: 'Laptop' },
  { Icon: IconDeviceDesktop, name: 'Desktop' },
  { Icon: IconKeyboard, name: 'Keyboard' },
  { Icon: IconMouse, name: 'Mouse' },
  { Icon: IconPrinter, name: 'Printer' },
  { Icon: IconPresentation, name: 'Projector' },
];

interface IconPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

type IconType = typeof COMMON_ICONS[number];

const IconPickerButton = forwardRef<
  HTMLDivElement,
  {
    selectedIcon?: IconType;
    value?: string;
    disabled?: boolean;
    onClick: () => void;
    onClear: () => void;
  }
>(({ selectedIcon, value, disabled, onClick, onClear }, ref) => {
  const SelectedIconComponent = selectedIcon?.Icon;
  
  return (
    <Group gap="xs" ref={ref}>
      <ActionIcon
        variant="default"
        size="lg"
        onClick={onClick}
        disabled={disabled}
      >
        {SelectedIconComponent ? (
          <SelectedIconComponent size={20} />
        ) : (
          <IconChevronDown size={16} />
        )}
      </ActionIcon>
      <Text size="sm" c="dimmed">
        {value || 'Select icon'}
      </Text>
      {value && !disabled && (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        >
          <IconX size={14} />
        </ActionIcon>
      )}
    </Group>
  );
});

IconPickerButton.displayName = 'IconPickerButton';

function IconGrid({
  filteredIcons,
  value,
  onChange,
  onClose,
}: {
  filteredIcons: typeof COMMON_ICONS;
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <SimpleGrid cols={4} spacing="xs">
      {filteredIcons.map(({ Icon, name }) => (
        <ActionIcon
          key={name}
          variant={value === name ? 'filled' : 'default'}
          size="xl"
          onClick={() => {
            onChange(name);
            onClose();
          }}
          title={name}
        >
          <Icon size={24} />
        </ActionIcon>
      ))}
    </SimpleGrid>
  );
}

/* eslint-disable max-lines-per-function */
export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');

  const selectedIcon = COMMON_ICONS.find(icon => icon.name === value);
  const filteredIcons = COMMON_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover opened={opened} onChange={setOpened} width={320} position="bottom-start">
      <Popover.Target>
        <IconPickerButton
          selectedIcon={selectedIcon}
          value={value}
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpened(!opened);
          }}
          onClear={() => {
            onChange(undefined);
          }}
        />
      </Popover.Target>

      <Popover.Dropdown>
        <Box>
          <TextInput
            placeholder="Search icons..."
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
            }}
            mb="sm"
          />
          <ScrollArea h={300}>
            <IconGrid
              filteredIcons={filteredIcons}
              value={value}
              onChange={onChange}
              onClose={() => {
                setOpened(false);
              }}
            />
            {filteredIcons.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No icons found
              </Text>
            )}
          </ScrollArea>
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
}
