/**
 * Book Asset Modal - Opens booking form with asset pre-selected (T126)
 */

import { Modal } from '@mantine/core'
import { BookingForm } from '../bookings/BookingForm'
import type { Asset, Booking } from '../../types/entities'

interface BookAssetModalProps {
  opened: boolean
  onClose: () => void
  asset: Asset
}

export function BookAssetModal({ opened, onClose, asset }: BookAssetModalProps) {
  // Create a partial booking with pre-selected asset
  const partialBooking: Partial<Booking> = {
    asset: { id: asset.id, assetNumber: asset.assetNumber, name: asset.name },
  }

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${asset.name} buchen`}
      size="lg"
    >
      <BookingForm
        booking={partialBooking as Booking}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  )
}
