/* eslint-disable max-lines-per-function */
import { useState } from 'react';
import { Button, Container, Group, Modal, Stack, Title } from '@mantine/core';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AssetDetail } from '../components/assets/AssetDetail';
import { AssetForm } from '../components/assets/AssetForm';
import { useAsset } from '../hooks/useAssets';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: asset } = useAsset(id || '');

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleBack = () => {
    navigate('/assets');
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  if (!id) {
    return (
      <Container size="xl">
        <Title order={1}>Asset not found</Title>
        <Button onClick={handleBack} mt="md">
          Back to Assets
        </Button>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
          >
            Back to Assets
          </Button>
        </Group>

        <AssetDetail assetId={id} onEdit={handleEdit} />

        {asset && (
          <Modal
            opened={isFormOpen}
            onClose={handleCancel}
            title={
              <Group gap="xs">
                <IconEdit size={20} />
                <span>Edit Asset</span>
              </Group>
            }
            size="lg"
          >
            <AssetForm
              asset={asset}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Modal>
        )}
      </Stack>
    </Container>
  );
}
