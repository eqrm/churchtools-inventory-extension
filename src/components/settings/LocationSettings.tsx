import { mdiMapMarker } from '@mdi/js';
import { MasterDataSettingsBase } from './MasterDataSettingsBase';
import { MASTER_DATA_DEFINITIONS } from '../../utils/masterData';
import { createMdiIconComponent } from '../../utils/mdiIconFactory';

const LocationIcon = createMdiIconComponent(mdiMapMarker);

export function LocationSettings() {
  return (
    <MasterDataSettingsBase
      definition={MASTER_DATA_DEFINITIONS.locations}
      title="Location Management"
      description="Manage pre-defined locations for quick assignment when creating/editing assets"
      placeholder="e.g., Main Warehouse, Storage Room A"
      entityLabel="Location"
      emptyStateMessage="No locations defined yet. Add locations to make asset management easier."
      noteMessage="Locations with assets cannot be deleted. Reassign or delete the assets first."
  icon={LocationIcon}
      columnLabel="Location Name"
    />
  );
}
