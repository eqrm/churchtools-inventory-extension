import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  FileInput,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconEdit, IconPhoto, IconPlus, IconTrash } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import type { ScannerFunction, ScannerModel, ScannerModelCreate } from '../../types/entities'

interface ScannerModelFormProps {
  opened: boolean
  onClose: () => void
  onSubmit: (model: ScannerModelCreate) => void
  initialModel?: ScannerModel
}

export function ScannerModelForm({ opened, onClose, onSubmit, initialModel }: ScannerModelFormProps) {
  const [imageBase64, setImageBase64] = useState<string | undefined>(initialModel?.imageBase64)
  const [functions, setFunctions] = useState<ScannerFunction[]>(
    initialModel?.supportedFunctions || []
  )

  const form = useForm({
    initialValues: {
      manufacturer: initialModel?.manufacturer || '',
      modelName: initialModel?.modelName || '',
      modelNumber: initialModel?.modelNumber || '',
      description: initialModel?.description || '',
    },
    validate: {
      manufacturer: (value) => (!value ? 'Manufacturer is required' : null),
      modelName: (value) => (!value ? 'Model name is required' : null),
    },
  })

  useFormInitialization(form, opened, initialModel, setImageBase64, setFunctions)

  const handleImageUpload = useImageUploadHandler(setImageBase64)

  const handleSubmit = form.onSubmit((values) => {
    onSubmit({
      manufacturer: values.manufacturer,
      modelName: values.modelName,
      modelNumber: values.modelNumber || undefined,
      description: values.description || undefined,
      imageBase64,
      supportedFunctions: functions,
    })
    form.reset()
    setImageBase64(undefined)
    setFunctions([])
    onClose()
  })

  return (
    <Modal opened={opened} onClose={onClose} title={initialModel ? 'Edit Scanner Model' : 'Add Scanner Model'} size="lg">
      <form onSubmit={handleSubmit}>
        <FormFields form={form} imageBase64={imageBase64} onImageUpload={handleImageUpload} />
        <Divider my="md" />
        <ScannerFunctionsEditor functions={functions} onChange={setFunctions} />
        <FormActions onClose={onClose} initialModel={initialModel} />
      </form>
    </Modal>
  )
}

function useImageUploadHandler(setImageBase64: (val: string | undefined) => void) {
  return (file: File | null) => {
    if (!file) {
      setImageBase64(undefined)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
}

function useFormInitialization(
  form: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  opened: boolean,
  initialModel: ScannerModel | undefined,
  setImageBase64: (val: string | undefined) => void,
  setFunctions: (val: ScannerFunction[]) => void
) {
  useEffect(() => {
    if (opened && initialModel) {
      form.setValues({
        manufacturer: initialModel.manufacturer,
        modelName: initialModel.modelName,
        modelNumber: initialModel.modelNumber || '',
        description: initialModel.description || '',
      })
      setImageBase64(initialModel.imageBase64)
      setFunctions(initialModel.supportedFunctions || [])
    } else if (opened && !initialModel) {
      form.reset()
      setImageBase64(undefined)
      setFunctions([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialModel])
}

interface FormFieldsProps {
  form: any // eslint-disable-line @typescript-eslint/no-explicit-any
  imageBase64: string | undefined
  onImageUpload: (file: File | null) => void
}

function FormFields({ form, imageBase64, onImageUpload }: FormFieldsProps) {
  return (
    <Stack gap="md">
      <TextInput
        label="Manufacturer"
        placeholder="e.g., Zebra, Honeywell, Datalogic"
        required
        {...form.getInputProps('manufacturer')}
      />
      <TextInput label="Model Name" placeholder="e.g., DS2208" required {...form.getInputProps('modelName')} />
      <TextInput label="Model Number" placeholder="e.g., DS2208-SR7U2100SGW" {...form.getInputProps('modelNumber')} />
      <Textarea
        label="Description"
        placeholder="Brief description of the scanner model"
        rows={3}
        {...form.getInputProps('description')}
      />
      <FileInput
        label="Scanner Image"
        placeholder="Upload scanner image"
        accept="image/*"
        leftSection={<IconPhoto size={16} />}
        onChange={onImageUpload}
        clearable
      />
      {imageBase64 && (
        <img
          src={imageBase64}
          alt="Scanner preview"
          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
        />
      )}
    </Stack>
  )
}

interface FormActionsProps {
  onClose: () => void
  initialModel?: ScannerModel
}

function FormActions({ onClose, initialModel }: FormActionsProps) {
  return (
    <Group justify="flex-end" gap="sm" mt="md">
      <Button variant="default" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit">{initialModel ? 'Update' : 'Add'} Scanner Model</Button>
    </Group>
  )
}

interface ScannerFunctionsEditorProps {
  functions: ScannerFunction[]
  onChange: (functions: ScannerFunction[]) => void
}

function ScannerFunctionsEditor({ functions, onChange }: ScannerFunctionsEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFunction, setNewFunction] = useState<Partial<ScannerFunction>>({
    category: 'other',
  })

  const handleAddFunction = () => {
    if (!newFunction.name || !newFunction.configBarcode) return

    const functionToAdd: ScannerFunction = {
      id: crypto.randomUUID(),
      name: newFunction.name,
      description: newFunction.description || '',
      configBarcode: newFunction.configBarcode,
      category: newFunction.category || 'other',
    }

    onChange([...functions, functionToAdd])
    setNewFunction({ category: 'other' })
    setShowAddForm(false)
  }

  const handleRemoveFunction = (id: string) => {
    onChange(functions.filter((f) => f.id !== id))
  }

  const handleEditFunction = (id: string, updated: Partial<ScannerFunction>) => {
    onChange(
      functions.map((f) =>
        f.id === id ? { ...f, ...updated } : f
      )
    )
  }

  return (
    <Stack gap="md">
      <FunctionEditorHeader onToggleAdd={() => setShowAddForm(!showAddForm)} />
      {showAddForm && (
        <AddFunctionForm
          newFunction={newFunction}
          onChange={setNewFunction}
          onAdd={handleAddFunction}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      <FunctionList functions={functions} onRemove={handleRemoveFunction} onEdit={handleEditFunction} />
    </Stack>
  )
}

interface FunctionEditorHeaderProps {
  onToggleAdd: () => void
}

function FunctionEditorHeader({ onToggleAdd }: FunctionEditorHeaderProps) {
  return (
    <Group justify="space-between">
      <Title order={5}>Scanner Functions</Title>
      <Button size="xs" leftSection={<IconPlus size={14} />} onClick={onToggleAdd}>
        Add Function
      </Button>
    </Group>
  )
}

interface FunctionListProps {
  functions: ScannerFunction[]
  onRemove: (id: string) => void
  onEdit: (id: string, updated: Partial<ScannerFunction>) => void
}

function FunctionList({ functions, onRemove, onEdit }: FunctionListProps) {
  if (functions.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No functions configured yet
      </Text>
    )
  }

  return (
    <Stack gap="xs">
      {functions.map((func) => (
        <FunctionListItem key={func.id} func={func} onRemove={onRemove} onEdit={onEdit} />
      ))}
    </Stack>
  )
}

interface AddFunctionFormProps {
  newFunction: Partial<ScannerFunction>
  onChange: (func: Partial<ScannerFunction>) => void
  onAdd: () => void
  onCancel: () => void
}

function AddFunctionForm({ newFunction, onChange, onAdd, onCancel }: AddFunctionFormProps) {
  return (
    <Stack gap="sm" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
      <TextInput
        label="Function Name"
        placeholder="e.g., Add Suffix"
        value={newFunction.name || ''}
        onChange={(e) => onChange({ ...newFunction, name: e.target.value })}
      />
      <TextInput
        label="Configuration Barcode"
        placeholder="e.g., *SUFFIX*"
        value={newFunction.configBarcode || ''}
        onChange={(e) => onChange({ ...newFunction, configBarcode: e.target.value })}
      />
      <TextInput
        label="Description"
        placeholder="Brief description"
        value={newFunction.description || ''}
        onChange={(e) => onChange({ ...newFunction, description: e.target.value })}
      />
      <Select
        label="Category"
        value={newFunction.category || 'other'}
        onChange={(value) => onChange({ ...newFunction, category: value as ScannerFunction['category'] })}
        data={[
          { value: 'prefix', label: 'Prefix' },
          { value: 'suffix', label: 'Suffix' },
          { value: 'formatting', label: 'Formatting' },
          { value: 'behavior', label: 'Behavior' },
          { value: 'other', label: 'Other' },
        ]}
      />
      <Group justify="flex-end" gap="xs">
        <Button size="xs" variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" onClick={onAdd}>
          Add
        </Button>
      </Group>
    </Stack>
  )
}

interface FunctionListItemProps {
  func: ScannerFunction
  onRemove: (id: string) => void
  onEdit: (id: string, updated: Partial<ScannerFunction>) => void
}

interface EditFunctionFormProps {
  editedFunc: Partial<ScannerFunction>
  onChange: (func: Partial<ScannerFunction>) => void
  onSave: () => void
  onCancel: () => void
  isSaveDisabled: boolean
}

function EditFunctionForm({ editedFunc, onChange, onSave, onCancel, isSaveDisabled }: EditFunctionFormProps) {
  return (
    <Paper p="sm" withBorder>
      <Stack gap="xs">
        <TextInput
          label="Function Name"
          value={editedFunc.name || ''}
          onChange={(e) => onChange({ ...editedFunc, name: e.currentTarget.value })}
          required
          size="xs"
        />
        <TextInput
          label="Configuration Barcode"
          value={editedFunc.configBarcode || ''}
          onChange={(e) => onChange({ ...editedFunc, configBarcode: e.currentTarget.value })}
          required
          size="xs"
        />
        <Textarea
          label="Description"
          value={editedFunc.description || ''}
          onChange={(e) => onChange({ ...editedFunc, description: e.currentTarget.value })}
          size="xs"
        />
        <Select
          label="Category"
          data={[
            { value: 'prefix', label: 'Prefix' },
            { value: 'suffix', label: 'Suffix' },
            { value: 'formatting', label: 'Formatting' },
            { value: 'behavior', label: 'Behavior' },
            { value: 'other', label: 'Other' },
          ]}
          value={editedFunc.category || 'other'}
          onChange={(value) => onChange({ ...editedFunc, category: value as ScannerFunction['category'] })}
          size="xs"
        />
        <Group justify="flex-end" gap="xs">
          <Button size="xs" variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="xs" onClick={onSave} disabled={isSaveDisabled}>
            Save
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

interface ViewFunctionProps {
  func: ScannerFunction
  onEdit: () => void
  onRemove: () => void
}

function ViewFunction({ func, onEdit, onRemove }: ViewFunctionProps) {
  return (
    <Group justify="space-between" p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
      <div>
        <Group gap={4}>
          <Text size="sm" fw={500}>
            {func.name}
          </Text>
          <Badge size="xs">{func.category}</Badge>
        </Group>
        <Text size="xs" c="dimmed">
          {func.configBarcode}
        </Text>
        {func.description && (
          <Text size="xs" c="dimmed">
            {func.description}
          </Text>
        )}
      </div>
      <Group gap="xs">
        <ActionIcon color="blue" variant="subtle" onClick={onEdit} aria-label="Edit function">
          <IconEdit size={16} />
        </ActionIcon>
        <ActionIcon color="red" variant="subtle" onClick={onRemove} aria-label="Remove function">
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Group>
  )
}

function FunctionListItem({ func, onRemove, onEdit }: FunctionListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedFunc, setEditedFunc] = useState<Partial<ScannerFunction>>({
    name: func.name,
    description: func.description,
    configBarcode: func.configBarcode,
    category: func.category,
  })

  const handleSave = () => {
    if (!editedFunc.name || !editedFunc.configBarcode) return
    onEdit(func.id, editedFunc)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedFunc({
      name: func.name,
      description: func.description,
      configBarcode: func.configBarcode,
      category: func.category,
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <EditFunctionForm
        editedFunc={editedFunc}
        onChange={setEditedFunc}
        onSave={handleSave}
        onCancel={handleCancel}
        isSaveDisabled={!editedFunc.name || !editedFunc.configBarcode}
      />
    )
  }

  return <ViewFunction func={func} onEdit={() => setIsEditing(true)} onRemove={() => onRemove(func.id)} />
}
