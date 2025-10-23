import { Container, Stack, Title, Text } from '@mantine/core';
import { ReportList } from '../components/reports/ReportList';

/**
 * Reports Page - Central hub for all reporting features
 * Provides access to:
 * - Booking History Reports
 * - Maintenance Compliance Reports
 * - Asset Utilization Reports
 * - Stock Take Summary Reports
 */
export function ReportsPage() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Reports</Title>
          <Text size="lg" c="dimmed" mt="xs">
            Generate and view reports for bookings, maintenance, assets, and stock take
          </Text>
        </div>

        <ReportList />
      </Stack>
    </Container>
  );
}
