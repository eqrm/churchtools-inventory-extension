import { SimpleGrid, Card, Text, Badge, Group, Stack, AspectRatio, Image } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import type { Asset } from '../../types/entities';
import { AssetStatusBadge } from './AssetStatusBadge';

interface AssetGalleryViewProps {
  assets: Asset[];
}

/**
 * Gallery view displaying assets as cards in a grid
 */
export function AssetGalleryView({ assets }: AssetGalleryViewProps) {
  if (assets.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Keine Assets gefunden
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
      {assets.map((asset) => (
        <Card
          key={asset.id}
          component={Link}
          to={`/assets/${asset.id}`}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer', textDecoration: 'none' }}
        >
          <Card.Section>
            {asset.photos && asset.photos.find(p => p.isMain) ? (
              <AspectRatio ratio={16/9}>
                <Image
                  src={asset.photos.find(p => p.isMain)?.thumbnailUrl}
                  alt={`${asset.name} main photo`}
                  fit="cover"
                />
              </AspectRatio>
            ) : (
              <IconPhoto size={64} style={{ margin: 'auto', color: 'var(--mantine-color-gray-4)' }} />
            )}
          </Card.Section>

          <Stack gap="xs" mt="md">
            <Text fw={500} lineClamp={1}>
              {asset.name}
            </Text>
            <Badge variant="light" size="sm">
              {asset.assetNumber}
            </Badge>
            <Group gap="xs">
              <AssetStatusBadge status={asset.status} />
            </Group>
            {asset.location && (
              <Text size="sm" c="dimmed" lineClamp={1}>
                📍 {asset.location}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}
