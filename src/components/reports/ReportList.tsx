/**
 * ReportList Component (T202)
 * 
 * Displays available pre-built reports in a card grid.
 */

import { Card, SimpleGrid, Text, Title, Group, ThemeIcon } from '@mantine/core';
import {
  IconChartLine,
  IconCalendarCheck,
  IconClipboardList,
  IconHistory,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const AVAILABLE_REPORTS: Report[] = [
  {
    id: 'utilization',
    name: 'Inventar-Auslastung',
    description: 'Buchungshäufigkeit, Nutzungsstunden und Leerlaufzeiten pro Inventargegenstand',
    icon: <IconChartLine size={24} />,
    path: '/reports/utilization',
  },
  {
    id: 'maintenance',
    name: 'Wartungs-Compliance',
    description: 'Überfällige vs. konforme Inventargegenstände und anstehende Wartungen',
    icon: <IconCalendarCheck size={24} />,
    path: '/reports/maintenance',
  },
  {
    id: 'stocktake',
    name: 'Inventur-Zusammenfassung',
    description: 'Gefundene vs. fehlende Inventargegenstände und Abweichungen',
    icon: <IconClipboardList size={24} />,
    path: '/reports/stocktake',
  },
  {
    id: 'bookings',
    name: 'Buchungsverlauf',
    description: 'Buchungstrends über die Zeit und beliebte Inventargegenstände',
    icon: <IconHistory size={24} />,
    path: '/reports/bookings',
  },
];

/**
 * ReportList Component
 */
export function ReportList() {
  const navigate = useNavigate();

  return (
    <div>
      <Title order={2} mb="lg">
        Berichte
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {AVAILABLE_REPORTS.map((report) => (
          <Card
            key={report.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(report.path)}
          >
            <Group mb="md">
              <ThemeIcon size="xl" radius="md" variant="light">
                {report.icon}
              </ThemeIcon>
              <Title order={4}>{report.name}</Title>
            </Group>
            <Text size="sm" c="dimmed">
              {report.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
}
