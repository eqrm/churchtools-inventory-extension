import { Container, Stack, Tabs, Title } from '@mantine/core';
import { IconAdjustments, IconBarcode, IconHash, IconMapPin } from '@tabler/icons-react';
import { useState } from 'react';
import { AssetPrefixList } from '../components/settings/AssetPrefixList';
import { LocationSettings } from '../components/settings/LocationSettings';
import { ScannerModelList } from '../components/settings/ScannerModelList';
import { ScannerModelForm } from '../components/settings/ScannerModelForm';
import type { ScannerModel, ScannerModelCreate } from '../types/entities';

/**
 * Settings page for organization-wide configuration (T227a, T290)
 * Provides tabs for different settings sections including scanner configuration
 */
export function SettingsPage() {
  const [scannerModels, setScannerModels] = useState<ScannerModel[]>(loadScannerModels());
  const [formOpen, setFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ScannerModel | undefined>(undefined);

  const {
    handleAddModel,
    handleEditModel,
    handleDeleteModel,
    handleSubmitModel,
  } = useScannerModelHandlers(scannerModels, setScannerModels, setFormOpen, setEditingModel, editingModel);

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Title order={1}>Settings</Title>

        <Tabs defaultValue="prefixes">
          <SettingsTabs
            scannerModels={scannerModels}
            onAddModel={handleAddModel}
            onEditModel={handleEditModel}
            onDeleteModel={handleDeleteModel}
          />
        </Tabs>

        <ScannerModelForm
          opened={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmitModel}
          initialModel={editingModel}
        />
      </Stack>
    </Container>
  );
}

function loadScannerModels(): ScannerModel[] {
  try {
    const stored = localStorage.getItem('scannerModels');
    return stored ? (JSON.parse(stored) as ScannerModel[]) : [];
  } catch {
    return [];
  }
}

function useScannerModelHandlers(
  scannerModels: ScannerModel[],
  setScannerModels: (models: ScannerModel[]) => void,
  setFormOpen: (open: boolean) => void,
  setEditingModel: (model: ScannerModel | undefined) => void,
  editingModel: ScannerModel | undefined
) {
  function saveScannerModels(models: ScannerModel[]) {
    localStorage.setItem('scannerModels', JSON.stringify(models));
    setScannerModels(models);
  }

  const handleAddModel = () => {
    setEditingModel(undefined);
    setFormOpen(true);
  };

  const handleEditModel = (model: ScannerModel) => {
    setEditingModel(model);
    setFormOpen(true);
  };

  const handleDeleteModel = (id: string) => {
    const updated = scannerModels.filter((m) => m.id !== id);
    saveScannerModels(updated);
  };

  const handleSubmitModel = (modelData: ScannerModelCreate) => {
    const now = new Date().toISOString();
    
    if (editingModel) {
      const updated = scannerModels.map((m) =>
        m.id === editingModel.id
          ? { ...modelData, id: editingModel.id, createdAt: editingModel.createdAt, lastModifiedAt: now }
          : m
      );
      saveScannerModels(updated);
    } else {
      const newModel: ScannerModel = {
        ...modelData,
        id: crypto.randomUUID(),
        createdAt: now,
        lastModifiedAt: now,
      };
      saveScannerModels([...scannerModels, newModel]);
    }
  };

  return { handleAddModel, handleEditModel, handleDeleteModel, handleSubmitModel };
}

interface SettingsTabsProps {
  scannerModels: ScannerModel[];
  onAddModel: () => void;
  onEditModel: (model: ScannerModel) => void;
  onDeleteModel: (id: string) => void;
}

function SettingsTabs({ scannerModels, onAddModel, onEditModel, onDeleteModel }: SettingsTabsProps) {
  return (
    <>
      <Tabs.List>
        <Tabs.Tab value="prefixes" leftSection={<IconHash size={16} />}>
          Asset Prefixes
        </Tabs.Tab>
        <Tabs.Tab value="locations" leftSection={<IconMapPin size={16} />}>
          Locations
        </Tabs.Tab>
        <Tabs.Tab value="scanners" leftSection={<IconBarcode size={16} />}>
          Scanners
        </Tabs.Tab>
        <Tabs.Tab value="general" leftSection={<IconAdjustments size={16} />}>
          General
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="prefixes" pt="md">
        <AssetPrefixList />
      </Tabs.Panel>

      <Tabs.Panel value="locations" pt="md">
        <LocationSettings />
      </Tabs.Panel>

      <Tabs.Panel value="scanners" pt="md">
        <ScannerModelList
          models={scannerModels}
          onAdd={onAddModel}
          onEdit={onEditModel}
          onDelete={onDeleteModel}
        />
      </Tabs.Panel>

      <Tabs.Panel value="general" pt="md">
        <Stack gap="md">
          <Title order={3}>General Settings</Title>
          {/* Future: Add general settings like date format, timezone, etc. */}
        </Stack>
      </Tabs.Panel>
    </>
  );
}
