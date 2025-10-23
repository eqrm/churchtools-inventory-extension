/**
 * Kits Page - Main list of equipment kits
 */

import { useState } from 'react';
import { Button, Group, Modal, Stack, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { KitList } from '../components/kits/KitList';
import { KitForm } from '../components/kits/KitForm';

export function KitsPage() {
  const [createModalOpened, setCreateModalOpened] = useState(false);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={1}>Equipment-Kits</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModalOpened(true)}
        >
          Neues Kit
        </Button>
      </Group>

      <KitList />

      <Modal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        title="Neues Equipment-Kit erstellen"
        size="lg"
      >
        <KitForm
          onSuccess={() => setCreateModalOpened(false)}
          onCancel={() => setCreateModalOpened(false)}
        />
      </Modal>
    </Stack>
  );
}
