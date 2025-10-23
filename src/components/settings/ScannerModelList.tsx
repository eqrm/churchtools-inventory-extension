import { ActionIcon, Badge, Button, Card, Group, Image, Modal, Stack, Text, Title } from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useState } from 'react'
import type { ScannerModel } from '../../types/entities'
import { EmptyState } from '../common/EmptyState'

interface ScannerModelListProps {
  models: ScannerModel[]
  onAdd: () => void
  onEdit: (model: ScannerModel) => void
  onDelete: (id: string) => void
}

export function ScannerModelList({ models, onAdd, onEdit, onDelete }: ScannerModelListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<ScannerModel | null>(null)

  const handleDeleteClick = (model: ScannerModel) => {
    setModelToDelete(model)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (modelToDelete) {
      onDelete(modelToDelete.id)
      setDeleteModalOpen(false)
      setModelToDelete(null)
    }
  }

  if (models.length === 0) {
    return (
      <Card withBorder>
        <EmptyState
          title="No Scanner Models"
          message="Add scanner models to display configuration barcodes for setting up your barcode scanners."
          action={
            <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
              Add Scanner Model
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <>
      <ScannerModelTable models={models} onAdd={onAdd} onEdit={onEdit} onDelete={handleDeleteClick} />
      <DeleteConfirmModal
        opened={deleteModalOpen}
        model={modelToDelete}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

interface ScannerModelTableProps {
  models: ScannerModel[]
  onAdd: () => void
  onEdit: (model: ScannerModel) => void
  onDelete: (model: ScannerModel) => void
}

function ScannerModelTable({ models, onAdd, onEdit, onDelete }: ScannerModelTableProps) {
  const columns = useScannerModelColumns(onEdit, onDelete)

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={3}>Scanner Models</Title>
          <Text size="sm" c="dimmed">
            Configure barcode scanner models and their setup functions
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
          Add Scanner Model
        </Button>
      </Group>

      <DataTable
        withTableBorder
        withColumnBorders
        striped
        highlightOnHover
        records={models}
        columns={columns}
        onRowClick={({ record }) => onEdit(record)}
        rowStyle={() => ({ cursor: 'pointer' })}
      />
    </Stack>
  )
}

function useScannerModelColumns(
  onEdit: (model: ScannerModel) => void,
  onDelete: (model: ScannerModel) => void
) {
  return [
    createImageColumn(),
    createManufacturerColumn(),
    createModelNameColumn(),
    createFunctionsColumn(),
    createDescriptionColumn(),
    createActionsColumn(onEdit, onDelete),
  ]
}

function createImageColumn() {
  return {
    accessor: 'imageBase64',
    title: 'Image',
    width: 100,
    render: (model: ScannerModel) =>
      model.imageBase64 ? (
        <Image
          src={model.imageBase64}
          alt={`${model.manufacturer} ${model.modelName}`}
          height={50}
          width={80}
          fit="contain"
        />
      ) : (
        <Text size="xs" c="dimmed">
          No image
        </Text>
      ),
  }
}

function createManufacturerColumn() {
  return {
    accessor: 'manufacturer',
    title: 'Manufacturer',
    sortable: true,
  }
}

function createModelNameColumn() {
  return {
    accessor: 'modelName',
    title: 'Model Name',
    sortable: true,
    render: (model: ScannerModel) => (
      <div>
        <Text fw={500}>{model.modelName}</Text>
        {model.modelNumber && (
          <Text size="xs" c="dimmed">
            {model.modelNumber}
          </Text>
        )}
      </div>
    ),
  }
}

function createFunctionsColumn() {
  return {
    accessor: 'supportedFunctions',
    title: 'Functions',
    render: (model: ScannerModel) => (
      <Badge variant="light" size="sm">
        {model.supportedFunctions.length} functions
      </Badge>
    ),
  }
}

function createDescriptionColumn() {
  return {
    accessor: 'description',
    title: 'Description',
    render: (model: ScannerModel) =>
      model.description ? (
        <Text size="sm" lineClamp={2}>
          {model.description}
        </Text>
      ) : (
        <Text size="sm" c="dimmed">
          No description
        </Text>
      ),
  }
}

function createActionsColumn(
  onEdit: (model: ScannerModel) => void,
  onDelete: (model: ScannerModel) => void
) {
  return {
    accessor: 'actions',
    title: 'Actions',
    width: 100,
    render: (model: ScannerModel) => (
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(model)
          }}
          aria-label="Edit scanner model"
        >
          <IconEdit size={16} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(model)
          }}
          aria-label="Delete scanner model"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    ),
  }
}

interface DeleteConfirmModalProps {
  opened: boolean
  model: ScannerModel | null
  onClose: () => void
  onConfirm: () => void
}

function DeleteConfirmModal({ opened, model, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete Scanner Model">
      <Stack gap="md">
        <Text>
          {model
            ? `Are you sure you want to delete ${model.manufacturer} ${model.modelName}? This action cannot be undone.`
            : ''}
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
