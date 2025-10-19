import { useState } from 'react';
import { Button, Container, Group, Modal, Stack, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { AssetCategoryList } from '../components/categories/AssetCategoryList';
import { AssetCategoryForm } from '../components/categories/AssetCategoryForm';
import type { AssetCategory } from '../types/entities';

export function CategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | undefined>();

  const handleEdit = (category: AssetCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCategory(undefined);
    setIsFormOpen(true);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={1}>Asset Categories</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreateNew}>
            New Category
          </Button>
        </Group>

        <AssetCategoryList onEdit={handleEdit} />

        <Modal
          opened={isFormOpen}
          onClose={handleCancel}
          title={editingCategory ? 'Edit Category' : 'Create New Category'}
          size="lg"
        >
          <AssetCategoryForm
            category={editingCategory}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Modal>
      </Stack>
    </Container>
  );
}
