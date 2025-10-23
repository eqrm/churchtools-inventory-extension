/**
 * T097 - US4: ChildAssetsList Component
 * Displays list of child assets on parent AssetDetail page
 */
import { Badge, Button, Card, Group, Menu, Stack, Text, Title } from '@mantine/core';
import { IconDots, IconLink, IconRefresh, IconTransfer, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssets } from '../../hooks/useAssets';
import { AssetStatusBadge } from './AssetStatusBadge';
import { BulkStatusUpdateModal } from './BulkStatusUpdateModal';
import { PropertyPropagationModal } from './PropertyPropagationModal';
import { ManageChildAssetsModal } from './ManageChildAssetsModal';
import type { Asset } from '../../types/entities';

interface ChildAssetsListProps {
  parentAsset: Asset;
}

interface StatusSummaryProps {
  statusSummary: Record<string, number>;
  totalCount: number;
}

function StatusSummaryBadges({ statusSummary, totalCount }: StatusSummaryProps) {
  const availableCount = statusSummary['available'] || 0;
  const inUseCount = statusSummary['in-use'] || 0;
  const brokenCount = statusSummary['broken'] || 0;
  const otherCount = totalCount - availableCount - inUseCount - brokenCount;

  return (
    <Group gap="xs">
      <Badge size="sm" variant="light" color="green">
        Available: {availableCount}
      </Badge>
      <Badge size="sm" variant="light" color="blue">
        In Use: {inUseCount}
      </Badge>
      {brokenCount > 0 && (
        <Badge size="sm" variant="light" color="red">
          Broken: {brokenCount}
        </Badge>
      )}
      {otherCount > 0 && (
        <Badge size="sm" variant="light" color="gray">
          Other: {otherCount}
        </Badge>
      )}
    </Group>
  );
}

interface ChildAssetItemProps {
  child: Asset;
  onNavigate: (id: string) => void;
}

function ChildAssetItem({ child, onNavigate }: ChildAssetItemProps) {
  return (
    <Group
      justify="space-between"
      p="sm"
      style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px', cursor: 'pointer' }}
      onClick={() => onNavigate(child.id)}
    >
      <Group gap="sm">
        <IconLink size={16} />
        <div>
          <Text size="sm" fw={500}>{child.name}</Text>
          <Text size="xs" c="dimmed">{child.assetNumber}</Text>
        </div>
      </Group>
      <Group gap="sm">
        <AssetStatusBadge status={child.status} size="sm" />
        {child.location && <Text size="xs" c="dimmed">{child.location}</Text>}
      </Group>
    </Group>
  );
}

interface ActionsMenuProps {
  onUpdateStatus: () => void;
  onPropagate: () => void;
  onManageChildren: () => void;
}

function ActionsMenu({ onUpdateStatus, onPropagate, onManageChildren }: ActionsMenuProps) {
  return (
    <Menu shadow="md" position="bottom-end">
      <Menu.Target>
        <Button size="xs" variant="light" rightSection={<IconDots size={14} />}>Actions</Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconUsers size={14} />} onClick={onManageChildren}>
          Manage Children
        </Menu.Item>
        <Menu.Item leftSection={<IconRefresh size={14} />} onClick={onUpdateStatus}>
          Update All Status
        </Menu.Item>
        <Menu.Item leftSection={<IconTransfer size={14} />} onClick={onPropagate}>
          Propagate Properties
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function ChildAssetsList({ parentAsset }: ChildAssetsListProps) {
  const navigate = useNavigate();
  const { data: allAssets = [] } = useAssets();
  const [bulkUpdateOpened, setBulkUpdateOpened] = useState(false);
  const [propagationOpened, setPropagationOpened] = useState(false);
  const [manageChildrenOpened, setManageChildrenOpened] = useState(false);

  const childAssets = allAssets.filter((asset) => asset.parentAssetId === parentAsset.id);
  if (childAssets.length === 0) return null;

  const statusSummary = childAssets.reduce((acc, child) => {
    acc[child.status] = (acc[child.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <BulkStatusUpdateModal opened={bulkUpdateOpened} onClose={() => setBulkUpdateOpened(false)} parentAsset={parentAsset} childAssets={childAssets} />
      <PropertyPropagationModal opened={propagationOpened} onClose={() => setPropagationOpened(false)} parentAsset={parentAsset} childAssets={childAssets} />
      <ManageChildAssetsModal opened={manageChildrenOpened} onClose={() => setManageChildrenOpened(false)} parentAsset={parentAsset} currentChildren={childAssets} />
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={5}>Child Assets ({childAssets.length})</Title>
            <ActionsMenu
              onManageChildren={() => setManageChildrenOpened(true)}
              onUpdateStatus={() => setBulkUpdateOpened(true)}
              onPropagate={() => setPropagationOpened(true)}
            />
          </Group>
          <StatusSummaryBadges statusSummary={statusSummary} totalCount={childAssets.length} />
          <Stack gap="xs">
            {childAssets.map((child) => (
              <ChildAssetItem key={child.id} child={child} onNavigate={(id) => navigate(`/assets/${id}`)} />
            ))}
          </Stack>
        </Stack>
      </Card>
    </>
  );
}
