import { Container, Stack, Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { ReportList } from '../components/reports/ReportList';
import { AssetUtilizationReport } from '../components/reports/AssetUtilizationReport';
import { MaintenanceComplianceReport } from '../components/reports/MaintenanceComplianceReport';
import { StockTakeSummaryReport } from '../components/reports/StockTakeSummaryReport';
import { BookingHistoryReport } from '../components/reports/BookingHistoryReport';

/**
 * Reports Page - Central hub for all reporting features
 * Provides access to:
 * - Booking History Reports
 * - Maintenance Compliance Reports
 * - Asset Utilization Reports
 * - Stock Take Summary Reports
 */
export function ReportsPage() {
  const { reportId } = useParams<{ reportId?: string }>();

  // If a specific report is selected, show that report
  if (reportId) {
    const renderReport = () => {
      switch (reportId) {
        case 'utilization':
          return <AssetUtilizationReport />;
        case 'maintenance':
          return <MaintenanceComplianceReport />;
        case 'stocktake':
          return <StockTakeSummaryReport />;
        case 'bookings':
          return <BookingHistoryReport />;
        default:
          return (
            <Text c="red">
              Bericht "{reportId}" nicht gefunden.
            </Text>
          );
      }
    };

    return (
      <Container size="xl" py="xl">
        <Stack gap="lg">
          <div>
            <Title order={1}>Reports</Title>
            <Text size="lg" c="dimmed" mt="xs">
              Generate and view reports for bookings, maintenance, assets, and stock take
            </Text>
          </div>

          {renderReport()}
        </Stack>
      </Container>
    );
  }

  // Otherwise, show the report list
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
