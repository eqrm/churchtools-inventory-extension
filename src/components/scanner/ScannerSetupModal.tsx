import { Button, Group, Modal, ScrollArea, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { notifications } from '@mantine/notifications'
import type { ScannerModel } from '../../types/entities'

interface ScannerSetupModalProps {
  opened: boolean
  onClose: () => void
  model: ScannerModel | null
}

export function ScannerSetupModal({ opened, onClose, model }: ScannerSetupModalProps) {
  if (!model) return null

  return (
    <Modal opened={opened} onClose={onClose} title="Scanner Setup Instructions" size="xl">
      <ScrollArea h={600}>
        <Stack gap="xl">
          <ModelInfo model={model} />
          <SetupInstructions />
          <ScannerTestSection />
          <ConfigurationBarcodes functions={model.supportedFunctions} />
          <Group justify="flex-end">
            <Button onClick={onClose}>Done</Button>
          </Group>
        </Stack>
      </ScrollArea>
    </Modal>
  )
}

interface ModelInfoProps {
  model: ScannerModel
}

function ModelInfo({ model }: ModelInfoProps) {
  return (
    <div>
      <Title order={4}>
        {model.manufacturer} {model.modelName}
      </Title>
      {model.modelNumber && (
        <Text size="sm" c="dimmed">
          Model: {model.modelNumber}
        </Text>
      )}
      {model.description && (
        <Text size="sm" mt="xs">
          {model.description}
        </Text>
      )}
    </div>
  )
}

function SetupInstructions() {
  return (
    <Stack gap="sm">
      <Title order={5}>Setup Instructions</Title>
      <Text size="sm">
        1. Put your scanner into configuration mode (usually by scanning a "Programming Mode" barcode from the
        manufacturer's manual)
      </Text>
      <Text size="sm">2. Test your scanner using the test section below</Text>
      <Text size="sm">3. Scan each configuration barcode below that you want to enable</Text>
      <Text size="sm">4. Exit configuration mode (usually by scanning a "Save and Exit" barcode)</Text>
      <Text size="sm" c="orange" fw={500}>
        ⚠️ Always test your scanner after configuration to ensure it works as expected
      </Text>
    </Stack>
  )
}

function ScannerTestSection() {
  const [testInput, setTestInput] = useState('')
  const testCanvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (testCanvasRef.current) {
      generateTestBarcode(testCanvasRef.current)
    }
  }, [])

  const handleTestInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTestInput(value)

    if (value === 'TESTDATA123') {
      showSuccessNotification()
      setTimeout(() => {
        setTestInput('')
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 1500)
    }
  }

  return (
    <Stack gap="sm" p="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', borderRadius: '8px' }}>
      <Title order={5}>Test Your Scanner</Title>
      <Text size="sm" c="dimmed">
        Scan the barcode below to test if your scanner is working correctly. The input field should automatically fill
        with "TESTDATA123".
      </Text>
      <Group align="flex-start" gap="xl">
        <div>
          <canvas ref={testCanvasRef} />
        </div>
        <TextInput
          ref={inputRef}
          label="Scan Test"
          placeholder="Click here and scan the test barcode"
          value={testInput}
          onChange={handleTestInputChange}
          style={{ flex: 1 }}
          size="md"
        />
      </Group>
    </Stack>
  )
}

function generateTestBarcode(canvas: HTMLCanvasElement) {
  try {
    JsBarcode(canvas, 'TESTDATA123', {
      format: 'CODE128',
      width: 1,
      height: 40,
      displayValue: true,
      fontSize: 11,
      margin: 3,
    })
  } catch (error) {
    console.error('Failed to generate test barcode:', error)
  }
}

function showSuccessNotification() {
  notifications.show({
    title: 'Scanner Test Successful!',
    message: 'Your scanner is working correctly',
    color: 'green',
  })
}

interface ConfigurationBarcodesProps {
  functions: ScannerModel['supportedFunctions']
}

function ConfigurationBarcodes({ functions }: ConfigurationBarcodesProps) {
  if (functions.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No configuration functions available for this scanner model
      </Text>
    )
  }

  const groupedFunctions = groupFunctionsByCategory(functions)

  return (
    <Stack gap="lg">
      <Title order={5}>Configuration Barcodes</Title>
      {Object.entries(groupedFunctions).map(([category, funcs]) => (
        <CategorySection key={category} category={category} functions={funcs} />
      ))}
    </Stack>
  )
}

function groupFunctionsByCategory(functions: ScannerModel['supportedFunctions']) {
  return functions.reduce(
    (acc, func) => {
      const category = func.category
      if (!acc[category]) {
        acc[category] = []
      }
      const categoryArray = acc[category]
      if (categoryArray) {
        categoryArray.push(func)
      }
      return acc
    },
    {} as Record<string, ScannerModel['supportedFunctions']>
  )
}

interface CategorySectionProps {
  category: string
  functions: ScannerModel['supportedFunctions']
}

function CategorySection({ category, functions }: CategorySectionProps) {
  return (
    <Stack gap="md">
      <Title order={6} tt="capitalize">
        {category}
      </Title>
      {functions.map((func) => (
        <BarcodeFunction key={func.id} func={func} />
      ))}
    </Stack>
  )
}

interface BarcodeFunctionProps {
  func: ScannerModel['supportedFunctions'][0]
}

function BarcodeFunction({ func }: BarcodeFunctionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && func.configBarcode) {
      try {
        JsBarcode(canvasRef.current, func.configBarcode, {
          format: 'CODE128',
          width: 1,
          height: 40,
          displayValue: true,
          fontSize: 11,
          margin: 3,
        })
      } catch (error) {
        console.error('Failed to generate barcode:', error)
      }
    }
  }, [func.configBarcode])

  return (
    <Stack gap="xs" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
      <div>
        <Text fw={500}>{func.name}</Text>
        {func.description && (
          <Text size="sm" c="dimmed">
            {func.description}
          </Text>
        )}
      </div>
      <canvas ref={canvasRef} />
    </Stack>
  )
}
