/* eslint-disable max-lines-per-function */
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconCalendar,
  IconDownload,
  IconEdit,
  IconHash,
  IconHistory,
  IconLocation,
  IconPackage,
  IconPrinter,
  IconTag,
  IconUser,
} from '@tabler/icons-react';
import { useAsset } from '../../hooks/useAssets';
import { useChangeHistory } from '../../hooks/useChangeHistory';
import { AssetStatusBadge } from './AssetStatusBadge';
import { BarcodeDisplay } from '../scanner/BarcodeDisplay';
import { QRCodeDisplay } from '../scanner/QRCodeDisplay';
import { DataTable } from 'mantine-datatable';
import type { ChangeHistoryEntry } from '../../types/entities';

interface AssetDetailProps {
  assetId: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function AssetDetail({ assetId, onEdit, onClose }: AssetDetailProps) {
  const { data: asset, isLoading, error } = useAsset(assetId);
  const { data: history = [] } = useChangeHistory(assetId, 10);

  if (isLoading) {
    return (
      <Card withBorder>
        <Text>Loading asset details...</Text>
      </Card>
    );
  }

  if (error || !asset) {
    return (
      <Card withBorder>
        <Text c="red">Error loading asset: {error?.message || 'Asset not found'}</Text>
      </Card>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <Group gap="xs" wrap="nowrap">
      <Box c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Box style={{ flex: 1 }}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {label}
        </Text>
        <Box>
          {value ? (
            typeof value === 'string' ? (
              <Text size="sm">{value}</Text>
            ) : (
              value
            )
          ) : (
            <Text size="sm" c="dimmed">—</Text>
          )}
        </Box>
      </Box>
    </Group>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Title order={2}>{asset.name}</Title>
          <AssetStatusBadge status={asset.status} size="md" />
        </Group>
        <Group>
          {onEdit && (
            <Button
              variant="default"
              leftSection={<IconEdit size={16} />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          {onClose && (
            <Button variant="subtle" onClick={onClose}>
              Close
            </Button>
          )}
        </Group>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Basic Information */}
            <Card withBorder>
              <Stack gap="md">
                <Title order={4}>Basic Information</Title>
                <Divider />
                
                <Grid>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconHash size={16} />}
                      label="Asset Number"
                      value={<Text fw={600}>{asset.assetNumber}</Text>}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconTag size={16} />}
                      label="Category"
                      value={<Badge variant="light">{asset.category.name}</Badge>}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <InfoRow
                      icon={<IconLocation size={16} />}
                      label="Location"
                      value={asset.location}
                    />
                  </Grid.Col>
                  {asset.barcode && (
                    <Grid.Col span={6}>
                      <InfoRow
                        icon={<IconPackage size={16} />}
                        label="Barcode"
                        value={asset.barcode}
                      />
                    </Grid.Col>
                  )}
                </Grid>

                {asset.description && (
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb="xs">
                      Description
                    </Text>
                    <Text size="sm">{asset.description}</Text>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Product Information */}
            {(asset.manufacturer || asset.model) && (
              <Card withBorder>
                <Stack gap="md">
                  <Title order={4}>Product Information</Title>
                  <Divider />
                  
                  <Grid>
                    {asset.manufacturer && (
                      <Grid.Col span={6}>
                        <InfoRow
                          icon={<IconPackage size={16} />}
                          label="Manufacturer"
                          value={asset.manufacturer}
                        />
                      </Grid.Col>
                    )}
                    {asset.model && (
                      <Grid.Col span={6}>
                        <InfoRow
                          icon={<IconPackage size={16} />}
                          label="Model"
                          value={asset.model}
                        />
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              </Card>
            )}

            {/* Custom Fields */}
            {Object.keys(asset.customFieldValues).length > 0 && (
              <Card withBorder>
                <Stack gap="md">
                  <Title order={4}>Custom Fields</Title>
                  <Divider />
                  
                  <Grid>
                    {Object.entries(asset.customFieldValues).map(([fieldName, value]) => {
                      return (
                        <Grid.Col key={fieldName} span={6}>
                          <InfoRow
                            icon={<IconTag size={16} />}
                            label={fieldName}
                            value={
                              Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'boolean'
                                ? value ? 'Yes' : 'No'
                                : String(value)
                            }
                          />
                        </Grid.Col>
                      );
                    })}
                  </Grid>
                </Stack>
              </Card>
            )}

            {/* Change History */}
            {history.length > 0 && (
              <Card withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconHistory size={20} />
                      <Title order={4}>Change History</Title>
                    </Group>
                    <Badge size="sm">{history.length} recent changes</Badge>
                  </Group>
                  <Divider />
                  
                  <DataTable
                    withTableBorder={false}
                    records={history}
                    columns={[
                      {
                        accessor: 'changedAt',
                        title: 'Date',
                        width: 150,
                        render: (entry: ChangeHistoryEntry) => (
                          <Text size="xs">{formatDate(entry.changedAt)}</Text>
                        ),
                      },
                      {
                        accessor: 'changedByName',
                        title: 'User',
                        render: (entry: ChangeHistoryEntry) => (
                          <Text size="sm">{entry.changedByName}</Text>
                        ),
                      },
                      {
                        accessor: 'action',
                        title: 'Action',
                        width: 100,
                        render: (entry: ChangeHistoryEntry) => (
                          <Badge
                            size="sm"
                            color={
                              entry.action === 'created'
                                ? 'green'
                                : entry.action === 'updated'
                                ? 'blue'
                                : 'red'
                            }
                          >
                            {entry.action}
                          </Badge>
                        ),
                      },
                      {
                        accessor: 'fieldName',
                        title: 'Field',
                        render: (entry: ChangeHistoryEntry) => (
                          <Text size="sm">{entry.fieldName || '—'}</Text>
                        ),
                      },
                      {
                        accessor: 'oldValue',
                        title: 'Old Value',
                        render: (entry: ChangeHistoryEntry) => (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {entry.oldValue || '—'}
                          </Text>
                        ),
                      },
                      {
                        accessor: 'newValue',
                        title: 'New Value',
                        render: (entry: ChangeHistoryEntry) => (
                          <Text size="xs" lineClamp={1}>
                            {entry.newValue || '—'}
                          </Text>
                        ),
                      },
                    ]}
                    minHeight={100}
                  />
                </Stack>
              </Card>
            )}
          </Stack>
        </Grid.Col>

        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Barcode */}
            <Card withBorder>
              <Stack gap="md" align="center">
                <Title order={5}>Barcode</Title>
                <Box style={{ border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <BarcodeDisplay 
                    value={asset.assetNumber}
                    alt={`Barcode for ${asset.assetNumber}`}
                    width={200}
                  />
                </Box>
                <Text size="xs" c="dimmed" ta="center">
                  Asset Number: {asset.assetNumber}
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => {
                      const promise = import('../../services/barcode/BarcodeService').then(m => {
                        const barcodeUrl = m.generateBarcode(asset.assetNumber);
                        m.downloadImage(barcodeUrl, `barcode-${asset.assetNumber}.png`);
                      }).catch((err: unknown) => {
                        console.error('Failed to download barcode:', err);
                      });
                      void promise;
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPrinter size={14} />}
                    onClick={() => {
                      const promise = import('../../services/barcode/BarcodeService').then(m => {
                        const barcodeUrl = m.generateBarcode(asset.assetNumber);
                        m.printImage(barcodeUrl, `Barcode - ${asset.name}`);
                      }).catch((err: unknown) => {
                        console.error('Failed to print barcode:', err);
                      });
                      void promise;
                    }}
                  >
                    Print
                  </Button>
                </Group>
              </Stack>
            </Card>

            {/* QR Code */}
            <Card withBorder>
              <Stack gap="md" align="center">
                <Title order={5}>QR Code</Title>
                <Tooltip label="Scan to view this asset in ChurchTools">
                  <Box style={{ border: '1px solid #e9ecef', padding: '12px', borderRadius: '8px', backgroundColor: '#fff' }}>
                    <QRCodeDisplay
                      value={`${window.location.origin}${window.location.pathname}#/assets/${asset.id}`}
                      alt={`QR Code for ${asset.assetNumber}`}
                      size={180}
                    />
                  </Box>
                </Tooltip>
                <Text size="xs" c="dimmed" ta="center">
                  Scan to view asset details
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => {
                      const promise = import('../../services/barcode/BarcodeService').then(async m => {
                        const qrUrl = await m.generateQRCode(`${window.location.origin}${window.location.pathname}#/assets/${asset.id}`);
                        m.downloadImage(qrUrl, `qrcode-${asset.assetNumber}.png`);
                      }).catch((err: unknown) => {
                        console.error('Failed to download QR code:', err);
                      });
                      void promise;
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPrinter size={14} />}
                    onClick={() => {
                      const promise = import('../../services/barcode/BarcodeService').then(async m => {
                        const qrUrl = await m.generateQRCode(`${window.location.origin}${window.location.pathname}#/assets/${asset.id}`);
                        m.printImage(qrUrl, `QR Code - ${asset.name}`);
                      }).catch((err: unknown) => {
                        console.error('Failed to print QR code:', err);
                      });
                      void promise;
                    }}
                  >
                    Print
                  </Button>
                </Group>
              </Stack>
            </Card>

            {/* Images - Coming in Phase 5 */}
            {/* Images functionality will be added in Phase 5: Media Management */}

            {/* Metadata */}
            <Card withBorder>
              <Stack gap="md">
                <Title order={5}>Metadata</Title>
                <Divider />
                
                <InfoRow
                  icon={<IconCalendar size={16} />}
                  label="Created"
                  value={formatDate(asset.createdAt)}
                />
                <InfoRow
                  icon={<IconCalendar size={16} />}
                  label="Last Updated"
                  value={formatDate(asset.lastModifiedAt)}
                />
                <InfoRow
                  icon={<IconUser size={16} />}
                  label="Created By"
                  value={asset.createdByName}
                />
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
