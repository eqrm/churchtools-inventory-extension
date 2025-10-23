import { Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconDisplay } from './IconDisplay';
import type { CustomFieldDefinition } from '../../types/entities';

interface CategoryTemplate {
  name: string;
  icon: string;
  description: string;
  customFields: Omit<CustomFieldDefinition, 'id'>[];
}

const TEMPLATES: CategoryTemplate[] = [
  {
    name: 'Audio Equipment',
    icon: 'Microphone',
    description: 'Microphones, speakers, mixers, and audio processors',
    customFields: [
      {
        name: 'Connector Type',
        type: 'select',
        required: false,
        helpText: 'Primary connector type',
        options: ['XLR', '1/4" TRS', '1/4" TS', 'RCA', 'Speakon', '3.5mm'],
      },
      {
        name: 'Impedance',
        type: 'text',
        required: false,
        helpText: 'Input/output impedance (e.g., "150Ω", "8Ω")',
      },
      {
        name: 'Power Rating',
        type: 'text',
        required: false,
        helpText: 'Power rating (e.g., "500W RMS")',
      },
      {
        name: 'Frequency Response',
        type: 'text',
        required: false,
        helpText: 'Frequency range (e.g., "20Hz-20kHz")',
      },
    ],
  },
  {
    name: 'Video Equipment',
    icon: 'Camera',
    description: 'Cameras, projectors, monitors, and video processors',
    customFields: [
      {
        name: 'Resolution',
        type: 'select',
        required: false,
        helpText: 'Native resolution',
        options: ['720p', '1080p', '4K UHD', '4K DCI', '8K'],
      },
      {
        name: 'Frame Rate',
        type: 'select',
        required: false,
        helpText: 'Maximum frame rate',
        options: ['24fps', '30fps', '50fps', '60fps', '120fps'],
      },
      {
        name: 'Lens Mount',
        type: 'text',
        required: false,
        helpText: 'Camera lens mount type (e.g., "EF", "E-Mount")',
      },
      {
        name: 'Video Inputs',
        type: 'multi-select',
        required: false,
        helpText: 'Available video input types',
        options: ['HDMI', 'SDI', 'DisplayPort', 'VGA', 'DVI', 'USB-C'],
      },
    ],
  },
  {
    name: 'Lighting Equipment',
    icon: 'Lighting',
    description: 'Stage lights, LED panels, and lighting controllers',
    customFields: [
      {
        name: 'Light Type',
        type: 'select',
        required: false,
        helpText: 'Type of lighting fixture',
        options: ['LED Par', 'Moving Head', 'Fresnel', 'Profile', 'Wash', 'Strobe'],
      },
      {
        name: 'Wattage',
        type: 'number',
        required: false,
        helpText: 'Power consumption in watts',
        validation: { min: 0, max: 10000 },
      },
      {
        name: 'Color Temperature',
        type: 'text',
        required: false,
        helpText: 'Color temperature (e.g., "3200K", "5600K")',
      },
      {
        name: 'DMX Address',
        type: 'number',
        required: false,
        helpText: 'DMX starting address (1-512)',
        validation: { min: 1, max: 512 },
      },
      {
        name: 'DMX Channels',
        type: 'number',
        required: false,
        helpText: 'Number of DMX channels used',
        validation: { min: 1, max: 512 },
      },
    ],
  },
  {
    name: 'Computers & Laptops',
    icon: 'Laptop',
    description: 'Desktop computers, laptops, and tablets',
    customFields: [
      {
        name: 'Processor',
        type: 'text',
        required: false,
        helpText: 'CPU model (e.g., "Intel Core i7-12700K")',
      },
      {
        name: 'RAM',
        type: 'text',
        required: false,
        helpText: 'Memory capacity (e.g., "16GB DDR4")',
      },
      {
        name: 'Storage',
        type: 'text',
        required: false,
        helpText: 'Storage capacity (e.g., "512GB SSD")',
      },
      {
        name: 'Operating System',
        type: 'select',
        required: false,
        helpText: 'Installed operating system',
        options: ['Windows 11', 'Windows 10', 'macOS Sonoma', 'macOS Ventura', 'Ubuntu', 'Other'],
      },
      {
        name: 'Serial Number',
        type: 'text',
        required: false,
        helpText: 'Device serial number',
      },
    ],
  },
  {
    name: 'Network Equipment',
    icon: 'Network',
    description: 'Routers, switches, access points, and cables',
    customFields: [
      {
        name: 'Port Count',
        type: 'number',
        required: false,
        helpText: 'Number of network ports',
        validation: { min: 1, max: 96 },
      },
      {
        name: 'Speed',
        type: 'select',
        required: false,
        helpText: 'Maximum port speed',
        options: ['10/100 Mbps', '1 Gbps', '2.5 Gbps', '10 Gbps', '40 Gbps'],
      },
      {
        name: 'PoE Support',
        type: 'checkbox',
        required: false,
        helpText: 'Supports Power over Ethernet',
      },
      {
        name: 'IP Address',
        type: 'text',
        required: false,
        helpText: 'Static IP address if configured',
      },
    ],
  },
  {
    name: 'Musical Instruments',
    icon: 'Music',
    description: 'Guitars, keyboards, drums, and accessories',
    customFields: [
      {
        name: 'Instrument Type',
        type: 'select',
        required: false,
        helpText: 'Type of instrument',
        options: ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Keyboard', 'Drums', 'Percussion', 'Brass', 'Woodwind', 'Strings'],
      },
      {
        name: 'Brand',
        type: 'text',
        required: false,
        helpText: 'Instrument brand',
      },
      {
        name: 'Key/Tuning',
        type: 'text',
        required: false,
        helpText: 'Key or standard tuning',
      },
      {
        name: 'Number of Keys/Strings',
        type: 'number',
        required: false,
        helpText: 'For keyboards or string instruments',
        validation: { min: 1, max: 200 },
      },
    ],
  },
];

interface CategoryTemplatesProps {
  onSelectTemplate: (template: CategoryTemplate) => void;
}

export function CategoryTemplates({ onSelectTemplate }: CategoryTemplatesProps) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Choose a template to quickly create a category with pre-configured custom fields. You can
        modify the fields after creation.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {TEMPLATES.map((template) => (
          <Card key={template.name} withBorder padding="md" radius="md">
            <Stack gap="sm">
              <Group gap="sm">
                <ThemeIcon size="lg" variant="light" color="blue">
                  <IconDisplay iconName={template.icon} size={24} />
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="sm">
                    {template.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {template.description}
                  </Text>
                </div>
              </Group>

              <Text size="xs" c="dimmed">
                {template.customFields.length} custom{' '}
                {template.customFields.length === 1 ? 'field' : 'fields'}
              </Text>

              <Button
                variant="light"
                size="xs"
                fullWidth
                onClick={() => {
                  onSelectTemplate(template);
                }}
              >
                Use Template
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
