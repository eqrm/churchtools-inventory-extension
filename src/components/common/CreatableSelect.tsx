import { forwardRef, useState, useEffect } from 'react';
import { Combobox, Pill, PillsInput, useCombobox } from '@mantine/core';

interface CreatableSelectProps {
  data: string[];
  onChange: (value: string) => void;
  onCreate: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
}

/**
 * CreatableSelect component - Dropdown with search + create new option functionality
 * Used for manufacturer and model fields to allow inline creation of new values
 */
export const CreatableSelect = forwardRef<HTMLInputElement, CreatableSelectProps>(
  ({ data, onChange, onCreate, placeholder, label, description, required, disabled, error, value: propValue }, ref) => {
    const combobox = useCombobox({
      onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [search, setSearch] = useState('');
    const [value, setValue] = useState<string>(propValue || '');

    // Update internal value when prop value changes
    useEffect(() => {
      if (propValue !== undefined && propValue !== value) {
        setValue(propValue);
        setSearch(propValue);
      }
    }, [propValue, value]);

    const exactOptionMatch = data.some((item) => item === search);
    const filteredOptions = data.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase().trim())
    );

    const options = filteredOptions.map((item) => (
      <Combobox.Option value={item} key={item}>
        {item}
      </Combobox.Option>
    ));

    return (
      <Combobox
        store={combobox}
        withinPortal={false}
        onOptionSubmit={(val) => {
          if (val === '$create') {
            onCreate(search);
            setValue(search);
            onChange(search);
          } else {
            setValue(val);
            onChange(val);
            setSearch(val);
          }
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <PillsInput
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            error={error}
            ref={ref}
          >
            <Pill.Group>
              {value && (
                <Pill withRemoveButton onRemove={() => {
                  setValue('');
                  onChange('');
                  setSearch('');
                }}>
                  {value}
                </Pill>
              )}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  onFocus={() => combobox.openDropdown()}
                  onChange={(event) => {
                    combobox.updateSelectedOptionIndex();
                    setSearch(event.currentTarget.value);
                  }}
                  value={search}
                  placeholder={value ? '' : placeholder}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && search.length === 0) {
                      event.preventDefault();
                      setValue('');
                      onChange('');
                    }
                  }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            {options}
            {!exactOptionMatch && search.trim().length > 0 && (
              <Combobox.Option value="$create">
                + Create "{search}"
              </Combobox.Option>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    );
  }
);

CreatableSelect.displayName = 'CreatableSelect';