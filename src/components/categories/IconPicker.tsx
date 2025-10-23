import { useEffect, useMemo, useState, forwardRef } from 'react';
import {
  ActionIcon,
  Popover,
  TextInput,
  Group,
  SimpleGrid,
  Text,
  Box,
  ScrollArea,
  Button,
  Stack,
  UnstyledButton,
} from '@mantine/core';
import { Icon } from '@mdi/react';
import { mdiChevronDown, mdiClose, mdiHelpCircleOutline } from '@mdi/js';
import {
  CATEGORY_ICON_OPTIONS,
  normalizeCategoryIconValue,
  resolveCategoryIconLabel,
  type CategoryIconOption,
} from '../../utils/iconMigrationMap';
import { IconDisplay } from './IconDisplay';
import { registerDynamicIcon } from '../../utils/iconMigrationMap';

interface IconPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

type IconType = CategoryIconOption;

const IconPickerButton = forwardRef<
  HTMLDivElement,
  {
    selectedIcon?: IconType | null;
    value?: string;
    label?: string;
    disabled?: boolean;
    onClick: () => void;
    onClear: () => void;
  }
>(({ selectedIcon, value, label, disabled, onClick, onClear }, ref) => {
  const displayLabel = label || value || 'Select icon';

  return (
    <Group gap="xs" ref={ref}>
      <Button
        variant="default"
        radius="md"
        type="button"
        onClick={onClick}
        disabled={disabled}
        rightSection={<Icon path={mdiChevronDown} size={0.7} />}
        fullWidth
      >
        <Group gap="xs">
          {selectedIcon ? (
            <IconDisplay iconName={selectedIcon.value} size={20} />
          ) : (
            <Icon path={mdiHelpCircleOutline} size={0.9} />
          )}
          <Text size="sm" fw={500} c="inherit">
            {displayLabel}
          </Text>
        </Group>
      </Button>
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
          <Icon path={mdiClose} size={0.7} />
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
  filteredIcons: CategoryIconOption[];
  value?: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <SimpleGrid cols={4} spacing="xs">
      {filteredIcons.map(({ label, value: iconValue }) => {
        const isSelected = value === iconValue;
        return (
          <UnstyledButton
            key={iconValue}
            onClick={() => {
              onChange(iconValue);
              onClose();
            }}
            style={(theme) => ({
              padding: theme.spacing.xs,
              borderRadius: theme.radius.md,
              border: `1px solid ${isSelected ? theme.colors.blue[6] : theme.colors.gray[3]}`,
              backgroundColor: isSelected ? theme.colors.blue[0] : theme.white,
              transition: 'border-color 150ms ease, background-color 150ms ease',
            })}
            title={label}
          >
            <Stack gap={4} align="center">
              <IconDisplay iconName={iconValue} size={28} />
              <Text size="xs" c="dimmed" ta="center" lineClamp={2}>
                {label}
              </Text>
            </Stack>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}

 
export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');

  const normalizedValue = useMemo(() => normalizeCategoryIconValue(value), [value]);

  useEffect(() => {
    if (value && normalizedValue && value !== normalizedValue) {
      onChange(normalizedValue);
    }
  }, [value, normalizedValue, onChange]);

  const selectedIcon = useMemo(() => {
    if (!normalizedValue) {
      return null;
    }
    return CATEGORY_ICON_OPTIONS.find((icon) => icon.value === normalizedValue) ?? null;
  }, [normalizedValue]);

  // Allow resolving arbitrary mdi icon names entered in the search box.
  // If user types an mdi name like 'account' or 'microphone', try to dynamically import
  // the symbol from '@mdi/js' (e.g. mdiAccount) and register it so it appears in the grid.
  const [dynamicRegisterCount, setDynamicRegisterCount] = useState(0);

  const filteredIcons = useMemo(() => {
    // include dynamicRegisterCount in the body so eslint knows the dependency is intentional
    void dynamicRegisterCount;
    const term = search.trim().toLowerCase();
    if (!term) {
      return CATEGORY_ICON_OPTIONS;
    }
    return CATEGORY_ICON_OPTIONS.filter((icon) => {
      const haystack = [icon.label, ...icon.keywords].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [search, dynamicRegisterCount]);

  useEffect(() => {
    const tryResolve = async () => {
      const term = search.trim();
      if (!term) return;
      // Accept plain names or prefixed 'mdi:account'
      const candidate = term.startsWith('mdi:') ? term.slice(4) : term;
      // build symbol name: mdiAccount -> camelcase with first letter uppercase
      const symbol = 'mdi' + candidate.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

      try {
        // dynamic import of @mdi/js module
        const mdiModule = await import('@mdi/js');
        const path = (mdiModule as unknown as Record<string, string>)[symbol];
        if (path && typeof path === 'string') {
          const value = `mdi:${candidate}`;
          // register option so normalizeCategoryIconValue can find it
          const added = registerDynamicIcon({ value, label: candidate, path, keywords: [candidate] });
          if (added) setDynamicRegisterCount((c) => c + 1);
        }
      } catch {
        // ignore resolution errors (module might not contain symbol)
      }
    };

    const timer = setTimeout(() => void tryResolve(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectedLabel = useMemo(() => {
    if (selectedIcon) {
      return selectedIcon.label;
    }
    return resolveCategoryIconLabel(value ?? undefined);
  }, [selectedIcon, value]);

  return (
    <Popover opened={opened} onChange={setOpened} width={320} position="bottom-start">
      <Popover.Target>
        <IconPickerButton
          selectedIcon={selectedIcon}
          value={normalizedValue ?? value}
          label={selectedLabel}
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
              value={normalizedValue}
              onChange={(newValue) => {
                if (newValue) {
                  onChange(newValue);
                }
              }}
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
