import { useState, useMemo } from 'react';
import { Box, Button, Card, Checkbox, Group, Modal, Stack, Text, TextInput, Title, Select } from '@mantine/core';
import { IconPlus, IconQrcode, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
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
import { EdgeCaseError } from '../types/edge-cases';
import { formatDistanceToNow } from '../utils/formatters';
import type { StockTakeSession, AssetStatus } from '../types/entities';

/**
 * StockTakePage - Main page for stock take management
 * 
 * Features:
 * - List all stock take sessions
 * - Create new sessions
 * - View session details
 * - Continue active sessions
 * - View completed session reports
 * 
 * Enhanced for E6:
 * - T277: Dynamic field selection toggles in scanner view
 * - T278: Current values inputs for selected fields
 * - T279: Selective field updates based on toggles
 * - T280: Value change UI with notifications
 */
 
export function StockTakePage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedNumber, setLastScannedNumber] = useState<string>('');
  
  // E6: Dynamic field update toggles and values (T277-T278)
  const [updateLocation, setUpdateLocation] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateCondition, setUpdateCondition] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<AssetStatus | null>(null);
  const [currentCondition, setCurrentCondition] = useState<string>('');

  // Load available locations from localStorage (for location dropdown)
  const availableLocations = useMemo(() => {
    const savedLocations = JSON.parse(
      localStorage.getItem('assetLocations') || '[]'
    ) as Array<{ name: string }>;
    
    return savedLocations.map((loc) => ({ value: loc.name, label: loc.name }));
  }, []);

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

    // E6: Prepare field updates based on dynamic toggles (T279)
    const fieldUpdates: Record<string, unknown> = {};
    const changedFields: string[] = [];
    
    if (updateLocation && currentLocation) {
      fieldUpdates['location'] = currentLocation;
    }
    if (updateStatus && currentStatus) {
      fieldUpdates['status'] = currentStatus;
    }
    if (updateCondition && currentCondition) {
      fieldUpdates['condition'] = currentCondition;
    }

    // Look up asset by barcode (or asset number as fallback) and add to session
    // Note: This triggers a query to find the asset, then adds the scan
    const lookupAsset = async () => {
      try {
        // Get all assets and search by barcode first, then asset number
        const allAssets = await storage?.getAssets();
        let asset = allAssets?.find(a => a.barcode === scannedValue);
        
        // Fallback to asset number if not found by barcode
        if (!asset) {
          asset = allAssets?.find(a => a.assetNumber === scannedValue);
        }
        
        if (!asset) {
          notifications.show({
            title: 'Asset Not Found',
            message: `No asset with barcode/number: ${scannedValue}`,
            color: 'orange',
          });
          return;
        }

        // Track which fields are changing for notification (T280)
        if (updateLocation && currentLocation && asset.location !== currentLocation) {
          changedFields.push(`location: ${asset.location || '(empty)'} → ${currentLocation}`);
        }
        if (updateStatus && currentStatus && asset.status !== currentStatus) {
          changedFields.push(`status: ${asset.status} → ${currentStatus}`);
        }
        if (updateCondition && currentCondition) {
          changedFields.push(`condition: updated`);
        }

        // Apply field updates to asset if any fields are selected
        if (Object.keys(fieldUpdates).length > 0) {
          await storage?.updateAsset(asset.id, fieldUpdates);
        }

        // Add scan to session
        addScan.mutate(
          {
            sessionId: viewingSession.id,
            assetId: asset.id,
            scannedBy: currentUser.id,
            location: currentLocation || asset.location,
          },
          {
            onSuccess: () => {
              // E6: Enhanced notification with field changes (T280)
              const message = changedFields.length > 0
                ? `${asset.name} (${asset.assetNumber})\n${changedFields.join(', ')}`
                : `${asset.name} (${asset.assetNumber})`;
              
              notifications.show({
                title: 'Asset Scanned',
                message,
                color: 'green',
                icon: <IconCheck size={16} />,
              });
            },
            onError: (error) => {
              // T241b: Enhanced duplicate scan error handling with timestamp
              if (error instanceof EdgeCaseError && error.duplicateScan) {
                const timeAgo = formatDistanceToNow(error.duplicateScan.scannedAt);
                notifications.show({
                  title: 'Already Scanned',
                  message: `${error.duplicateScan.assetNumber} was already scanned ${timeAgo} by ${error.duplicateScan.scannedBy}`,
                  color: 'yellow',
                  icon: <IconAlertTriangle size={16} />,
                  autoClose: 5000,
                });
                return;
              }
              
              // Generic error handling
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
                      
                      {/* E6: Dynamic field update controls (T277-T278) */}
                      <Card withBorder padding="sm" bg="gray.0">
                        <Stack gap="md">
                          <Text size="sm" fw={500}>Update Fields During Scan</Text>
                          
                          <Stack gap="xs">
                            <Checkbox
                              label="Update Location"
                              checked={updateLocation}
                              onChange={(e) => setUpdateLocation(e.currentTarget.checked)}
                            />
                            {updateLocation && (
                              <Select
                                placeholder="Select or type location..."
                                value={currentLocation}
                                onChange={(value) => setCurrentLocation(value || '')}
                                searchable
                                allowDeselect
                                data={availableLocations}
                                onSearchChange={(query) => {
                                  // Allow typing custom location
                                  if (query && !currentLocation) {
                                    setCurrentLocation(query);
                                  }
                                }}
                                size="sm"
                              />
                            )}
                          </Stack>
                          
                          <Stack gap="xs">
                            <Checkbox
                              label="Update Status"
                              checked={updateStatus}
                              onChange={(e) => setUpdateStatus(e.currentTarget.checked)}
                            />
                            {updateStatus && (
                              <Select
                                placeholder="Select status..."
                                value={currentStatus}
                                onChange={(value) => setCurrentStatus(value as AssetStatus)}
                                data={[
                                  { value: 'available', label: 'Available' },
                                  { value: 'in-use', label: 'In Use' },
                                  { value: 'maintenance', label: 'Maintenance' },
                                  { value: 'broken', label: 'Broken' },
                                  { value: 'lost', label: 'Lost' },
                                  { value: 'retired', label: 'Retired' },
                                ]}
                                size="sm"
                              />
                            )}
                          </Stack>
                          
                          <Stack gap="xs">
                            <Checkbox
                              label="Update Condition Notes"
                              checked={updateCondition}
                              onChange={(e) => setUpdateCondition(e.currentTarget.checked)}
                            />
                            {updateCondition && (
                              <TextInput
                                placeholder="Enter condition notes..."
                                value={currentCondition}
                                onChange={(e) => setCurrentCondition(e.currentTarget.value)}
                                size="sm"
                              />
                            )}
                          </Stack>
                        </Stack>
                      </Card>
                      
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
          <StockTakeSessionList onView={handleViewSession} />
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
