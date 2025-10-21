/**
 * Sync Progress Indicator (T166)
 * Shows real-time progress of syncing queued scans
 */

import { Alert, Progress, Text, Group, Button } from '@mantine/core';
import { IconCloudUpload, IconCheck, IconX } from '@tabler/icons-react';
import { useSyncService } from '../../hooks/useSyncService';
import type { SyncProgress } from '../../services/storage/SyncService';

/**
 * Show syncing progress bar
 */
function SyncingProgress({ syncProgress }: { syncProgress: SyncProgress }) {
    const percentage = syncProgress.total > 0
        ? (syncProgress.completed / syncProgress.total) * 100
        : 0;

    return (
        <Alert color="blue" icon={<IconCloudUpload size={20} />} mb="md">
            <Text size="sm" mb="xs">
                Synchronisiere Scans...
            </Text>
            <Progress value={percentage} size="sm" mb="xs" />
            <Group gap="xs">
                <Text size="xs" c="dimmed">
                    {syncProgress.completed} / {syncProgress.total}
                </Text>
                {syncProgress.failed > 0 && (
                    <Text size="xs" c="red">
                        ({syncProgress.failed} fehlgeschlagen)
                    </Text>
                )}
            </Group>
        </Alert>
    );
}

/**
 * Show pending items with manual sync button
 */
function PendingSync({ syncProgress, triggerSync }: {
    syncProgress: SyncProgress;
    triggerSync: () => void;
}) {
    return (
        <Alert color="orange" icon={<IconCloudUpload size={20} />} mb="md">
            <Group justify="space-between">
                <div>
                    <Text size="sm" fw={500}>
                        {syncProgress.total} Scan(s) warten auf Synchronisation
                    </Text>
                    {syncProgress.failed > 0 && (
                        <Text size="xs" c="red" mt={4}>
                            <IconX size={14} style={{ verticalAlign: 'middle' }} />
                            {' '}{syncProgress.failed} fehlgeschlagen
                        </Text>
                    )}
                    {syncProgress.completed > 0 && (
                        <Text size="xs" c="green" mt={4}>
                            <IconCheck size={14} style={{ verticalAlign: 'middle' }} />
                            {' '}{syncProgress.completed} erfolgreich
                        </Text>
                    )}
                </div>
                <Button size="xs" onClick={triggerSync}>
                    Jetzt synchronisieren
                </Button>
            </Group>
        </Alert>
    );
}

/**
 * Indicator showing sync progress with manual trigger button
 */
export function SyncProgressIndicator() {
    const { syncProgress, hasPending, triggerSync, isOnline } = useSyncService();

    if (!hasPending) {
        return null;
    }

    if (!isOnline) {
        return (
            <Alert color="yellow" icon={<IconCloudUpload size={20} />} mb="md">
                <Text size="sm">
                    {syncProgress.total} Scan(s) warten auf Synchronisation.
                    Verbindung wird automatisch synchronisiert, sobald Sie online sind.
                </Text>
            </Alert>
        );
    }

    if (syncProgress.isSyncing) {
        return <SyncingProgress syncProgress={syncProgress} />;
    }

    return <PendingSync syncProgress={syncProgress} triggerSync={() => { void triggerSync(); }} />;
}
