import { Card, Stack, Text, Badge, Group } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Asset } from '../../types/entities';
import { useBookings } from '../../hooks/useBookings';

interface AssetCalendarViewProps {
  assets: Asset[];
}

/**
 * Calendar view showing asset bookings timeline
 * Note: Full calendar implementation pending - currently shows selected date bookings
 */
export function AssetCalendarView({ assets }: AssetCalendarViewProps) {
  const [selectedDate] = useState<Date>(new Date());
  const { data: allBookings } = useBookings();

  const bookingsOnDate = (allBookings || []).filter((booking) => {
    const start = parseISO(booking.startDate);
    const end = parseISO(booking.endDate);
    return selectedDate >= start && selectedDate <= end;
  });

  const assetIdsWithBookings = new Set(
    (allBookings || [])
      .filter((b) => b.status === 'active' || b.status === 'pending')
      .map((b) => b.asset?.id)
      .filter((id): id is string => !!id)
  );

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Kalenderansicht für Asset-Buchungen
      </Text>
      <Text size="xs" c="dimmed">
        Ausgewähltes Datum: {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
      </Text>

      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>
            Buchungen am {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
          </Text>

          {bookingsOnDate.length === 0 ? (
            <Text c="dimmed" size="sm">
              Keine Buchungen an diesem Tag
            </Text>
          ) : (
            <Stack gap="xs">
              {bookingsOnDate.map((booking) => {
                const asset = booking.asset;
                return (
                  <Card key={booking.id} padding="xs" withBorder>
                    <Group justify="space-between">
                      <Stack gap={4}>
                        {asset && (
                          <Text
                            component={Link}
                            to={`/assets/${asset.id}`}
                            fw={500}
                            size="sm"
                            style={{ textDecoration: 'none' }}
                          >
                            {asset.name}
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">
                          {booking.purpose}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {format(parseISO(booking.startDate), 'dd.MM.yyyy')} -{' '}
                          {format(parseISO(booking.endDate), 'dd.MM.yyyy')}
                        </Text>
                      </Stack>
                      <Badge
                        color={
                          booking.status === 'active'
                            ? 'blue'
                            : booking.status === 'pending'
                              ? 'yellow'
                              : 'gray'
                        }
                      >
                        {booking.status}
                      </Badge>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Card>

      <Card withBorder>
        <Stack gap="sm">
          <Text fw={600}>Assets mit aktiven Buchungen</Text>
          <Group gap="xs">
            {assets
              .filter((asset) => assetIdsWithBookings.has(asset.id))
              .map((asset) => (
                <Badge
                  key={asset.id}
                  component={Link}
                  to={`/assets/${asset.id}`}
                  variant="light"
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  {asset.assetNumber}
                </Badge>
              ))}
            {assetIdsWithBookings.size === 0 && (
              <Text c="dimmed" size="sm">
                Keine Assets gebucht
              </Text>
            )}
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
