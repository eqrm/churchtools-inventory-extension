import { Container, Stack, Title, Text } from '@mantine/core';
import { MaintenanceDashboard } from '../components/maintenance/MaintenanceDashboard';

/**
 * Maintenance Page - Central hub for maintenance management
 * Provides:
 * - Upcoming maintenance schedules
 * - Overdue maintenance alerts
 * - Maintenance compliance tracking
 * - Quick access to maintenance records
 */
export function MaintenancePage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Maintenance</Title>
          <Text size="lg" c="dimmed" mt="xs">
            Track and manage asset maintenance schedules and compliance
          </Text>
        </div>

        <MaintenanceDashboard />
      </Stack>
    </Container>
  );
}
