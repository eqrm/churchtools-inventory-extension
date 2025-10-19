import { useState } from 'react';
import { Container, Modal, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { AssetList } from '../components/assets/AssetList';
import { AssetForm } from '../components/assets/AssetForm';
import { useUIStore } from '../stores/uiStore';
import type { Asset } from '../types/entities';

export function AssetsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  
  // T061: Integrate AssetList with filters from uiStore
  const assetFilters = useUIStore((state) => state.assetFilters);

  const handleView = (asset: Asset) => {
    navigate(`/assets/${asset.id}`);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingAsset(undefined);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingAsset(undefined);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAsset(undefined);
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <AssetList
          onView={handleView}
          onEdit={handleEdit}
          onCreateNew={handleCreateNew}
          initialFilters={assetFilters}
        />

        <Modal
          opened={isFormOpen}
          onClose={handleCancel}
          title={editingAsset ? 'Edit Asset' : 'Create New Asset'}
          size="lg"
        >
          <AssetForm
            asset={editingAsset}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Modal>
      </Stack>
    </Container>
  );
}
