import { useState } from 'react';
import { Box, Button, Card, Group, Modal, Stack, Text, Title } from '@mantine/core';
import { IconPlus, IconQrcode, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { StockTakeSessionList } from '../components/stocktake/StockTakeSessionList';
import { StartStockTakeForm } from '../components/stocktake/StartStockTakeForm';
import { StockTakeScanList } from '../components/stocktake/StockTakeScanList';
import { StockTakeProgress } from '../components/stocktake/StockTakeProgress';
import { StockTakeReport } from '../components/stocktake/StockTakeReport';
import { BarcodeScanner } from '../components/scanner/BarcodeScanner';
import { useStockTakeSession, useAddStockTakeScan, useCompleteStockTakeSession } from '../hooks/useStockTake';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useStorageProvider } from '../hooks/useStorageProvider';
import type { StockTakeSession } from '../types/entities';

/**
 * StockTakePage - Main page for stock take management
 * 
 * Features:
 * - List all stock take sessions
 * - Create new sessions
 * - View session details
 * - Continue active sessions
 * - View completed session reports
 */
/* eslint-disable max-lines-per-function */
export function StockTakePage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedNumber, setLastScannedNumber] = useState<string>('');

  // Fetch selected session details
  const { data: viewingSession } = useStockTakeSession(viewingSessionId || '');
  const { data: currentUser } = useCurrentUser();
  const storage = useStorageProvider();
  const addScan = useAddStockTakeScan();
  const completeSession = useCompleteStockTakeSession();

  const handleCreateSuccess = (sessionId: string) => {
    setCreateModalOpened(false);
    setViewingSessionId(sessionId);
    setScannerActive(true); // Auto-open scanner for new sessions
  };

  const handleViewSession = (session: StockTakeSession) => {
    setViewingSessionId(session.id);
    if (session.status === 'active') {
      setScannerActive(true);
    }
  };

  const handleScan = (scannedValue: string): void => {
    if (!viewingSession || !currentUser) return;

    setLastScannedNumber(scannedValue);

    // Look up asset by number and add to session
    // Note: This triggers a query to find the asset, then adds the scan
    const lookupAsset = async () => {
      try {
        const asset = await storage?.getAssetByNumber(scannedValue);
        if (!asset) {
          notifications.show({
            title: 'Asset Not Found',
            message: `No asset with number: ${scannedValue}`,
            color: 'orange',
          });
          return;
        }

        // Add scan to session
        addScan.mutate(
          {
            sessionId: viewingSession.id,
            assetId: asset.id,
            scannedBy: currentUser.id,
            location: asset.location,
          },
          {
            onSuccess: () => {
              notifications.show({
                title: 'Asset Scanned',
                message: `${asset.name} (${asset.assetNumber})`,
                color: 'green',
                icon: <IconCheck size={16} />,
              });
            },
            onError: (error) => {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              notifications.show({
                title: 'Scan Failed',
                message: errorMessage,
                color: 'red',
              });
            },
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        notifications.show({
          title: 'Asset Lookup Failed',
          message: errorMessage,
          color: 'red',
        });
      }
    };

    void lookupAsset();
  };

  const handleCompleteSession = (): void => {
    if (!viewingSession) return;

    completeSession.mutate(
      { sessionId: viewingSession.id },
      {
        onSuccess: () => {
          setScannerActive(false);
          notifications.show({
            title: 'Session Completed',
            message: 'Stock take session has been completed',
            color: 'green',
            icon: <IconCheck size={16} />,
          });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          notifications.show({
            title: 'Error',
            message: `Failed to complete session: ${errorMessage}`,
            color: 'red',
          });
        },
      }
    );
  };

  return (
    <Box>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Title order={1}>Stock Take</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setCreateModalOpened(true);
            }}
          >
            New Stock Take
          </Button>
        </Group>

        {/* Session Details View */}
        {viewingSession ? (
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={2}>
                {viewingSession.status === 'active' ? 'Active Session' : 'Session Report'}
              </Title>
              <Group>
                {viewingSession.status === 'active' && (
                  <>
                    <Button
                      variant={scannerActive ? 'filled' : 'light'}
                      leftSection={<IconQrcode size={16} />}
                      onClick={() => {
                        setScannerActive(!scannerActive);
                      }}
                    >
                      {scannerActive ? 'Hide Scanner' : 'Show Scanner'}
                    </Button>
                    <Button
                      color="green"
                      leftSection={<IconCheck size={16} />}
                      onClick={handleCompleteSession}
                      loading={completeSession.isPending}
                    >
                      Complete Session
                    </Button>
                  </>
                )}
                <Button
                  variant="subtle"
                  onClick={() => {
                    setViewingSessionId(null);
                    setScannerActive(false);
                  }}
                >
                  Back to List
                </Button>
              </Group>
            </Group>

            {viewingSession.status === 'active' ? (
              <>
                <StockTakeProgress session={viewingSession} />
                
                {/* Scanner Interface */}
                {scannerActive && (
                  <Card withBorder>
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={500} size="lg">Scan Assets</Text>
                        {lastScannedNumber && (
                          <Text size="sm" c="dimmed">
                            Last scanned: {lastScannedNumber}
                          </Text>
                        )}
                      </Group>
                      <Box style={{ minHeight: 200 }}>
                        <BarcodeScanner
                          onScan={handleScan}
                          onError={(error) => {
                            notifications.show({
                              title: 'Scanner Error',
                              message: error,
                              color: 'red',
                            });
                          }}
                        />
                      </Box>
                    </Stack>
                  </Card>
                )}

                <StockTakeScanList session={viewingSession} />
              </>
            ) : (
              <StockTakeReport session={viewingSession} />
            )}
          </Stack>
        ) : (
          /* Session List View */
          <StockTakeSessionList
            onView={handleViewSession}
            onCreateNew={() => {
              setCreateModalOpened(true);
            }}
          />
        )}
      </Stack>

      {/* Create Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          setCreateModalOpened(false);
        }}
        title="Start New Stock Take"
        size="lg"
      >
        <StartStockTakeForm
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setCreateModalOpened(false);
          }}
        />
      </Modal>
    </Box>
  );
}
