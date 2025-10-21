/**
 * T098 - US4: ParentAssetLink Component
 * Displays link to parent asset on child AssetDetail page
 */
import { Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowUp } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAsset } from '../../hooks/useAssets';

interface ParentAssetLinkProps {
  parentAssetId: string;
}

export function ParentAssetLink({ parentAssetId }: ParentAssetLinkProps) {
  const navigate = useNavigate();
  const { data: parentAsset, isLoading } = useAsset(parentAssetId);

  if (isLoading) {
    return (
      <Card withBorder>
        <Text size="sm" c="dimmed">Loading parent asset...</Text>
      </Card>
    );
  }

  if (!parentAsset) {
    return null;
  }

  return (
    <Card withBorder>
      <Stack gap="sm">
        <Title order={5}>Parent Asset</Title>
        <Group
          gap="sm"
          p="sm"
          style={{
            backgroundColor: 'var(--mantine-color-blue-0)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/assets/${parentAsset.id}`)}
        >
          <IconArrowUp size={20} />
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>
              {parentAsset.name}
            </Text>
            <Text size="xs" c="dimmed">
              {parentAsset.assetNumber}
            </Text>
          </div>
        </Group>
      </Stack>
    </Card>
  );
}
