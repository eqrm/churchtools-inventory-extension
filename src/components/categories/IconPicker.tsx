import { useCallback, useEffect, useMemo, useState, forwardRef } from 'react';
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
import { getCachedIconOption, searchIconOptions } from '../../utils/mdiDynamicRegistry';

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
    return (
      CATEGORY_ICON_OPTIONS.find((icon) => icon.value === normalizedValue) ??
      getCachedIconOption(normalizedValue) ??
      null
    );
  }, [normalizedValue]);

  const [dynamicResults, setDynamicResults] = useState<CategoryIconOption[]>([]);
  const [searching, setSearching] = useState(false);

  const filteredIcons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return CATEGORY_ICON_OPTIONS;
    }

    const matches = CATEGORY_ICON_OPTIONS.filter((icon) => {
      const haystack = [icon.label, ...icon.keywords].join(' ').toLowerCase();
      return haystack.includes(term);
    });

    if (dynamicResults.length === 0) {
      return matches;
    }

    const seen = new Set<string>();
    const combined: CategoryIconOption[] = [];

    for (const option of dynamicResults) {
      if (!seen.has(option.value)) {
        seen.add(option.value);
        combined.push(option);
      }
    }

    for (const option of matches) {
      if (!seen.has(option.value)) {
        seen.add(option.value);
        combined.push(option);
      }
    }

    return combined;
  }, [search, dynamicResults]);

  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setDynamicResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(() => {
      void searchIconOptions(term, 60)
        .then((options) => {
          if (cancelled) {
            return;
          }
          setDynamicResults(options);
        })
        .catch(() => {
          if (!cancelled) {
            setDynamicResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const selectedLabel = useMemo(() => {
    if (selectedIcon) {
      return selectedIcon.label;
    }
    return resolveCategoryIconLabel(value ?? undefined);
  }, [selectedIcon, value]);

  const handleSelect = useCallback(
    (newValue: string) => {
      if (!newValue) {
        return;
      }
      const option = getCachedIconOption(newValue);
      if (option) {
        registerDynamicIcon(option);
      }
      onChange(newValue);
    },
    [onChange],
  );

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
              onChange={handleSelect}
              onClose={() => {
                setOpened(false);
              }}
            />
            {searching && (
              <Text size="xs" c="dimmed" ta="center" py="sm">
                Searching the MDI library...
              </Text>
            )}
            {!searching && filteredIcons.length === 0 && (
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
