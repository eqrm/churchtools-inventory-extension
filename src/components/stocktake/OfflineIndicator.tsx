/**
 * Offline Indicator Banner (T163)
 * Shows when user is offline during stock take session
 */

import { Alert, Text } from '@mantine/core';
import { IconWifiOff } from '@tabler/icons-react';

interface OfflineIndicatorProps {
    pendingSyncs?: number;
}

/**
 * Banner shown when offline with pending sync count
 */
export function OfflineIndicator({ pendingSyncs = 0 }: OfflineIndicatorProps) {
    return (
        <Alert
            color="yellow"
            icon={<IconWifiOff size={20} />}
            title="Offline-Modus"
            mb="md"
        >
            <Text size="sm">
                Sie sind aktuell offline. Alle Scans werden lokal gespeichert und
                automatisch synchronisiert, sobald die Verbindung wiederhergestellt ist.
            </Text>
            {pendingSyncs > 0 && (
                <Text size="sm" fw={500} mt="xs">
                    {pendingSyncs} Scan(s) warten auf Synchronisation
                </Text>
            )}
        </Alert>
    );
}
