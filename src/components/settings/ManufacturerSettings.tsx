import { mdiFactory } from '@mdi/js';
import { MasterDataSettingsBase } from './MasterDataSettingsBase';
import { MASTER_DATA_DEFINITIONS } from '../../utils/masterData';
import { createMdiIconComponent } from '../../utils/mdiIconFactory';

const ManufacturerIcon = createMdiIconComponent(mdiFactory);

export function ManufacturerSettings() {
  return (
    <MasterDataSettingsBase
      definition={MASTER_DATA_DEFINITIONS.manufacturers}
      title="Manufacturer Management"
      description="Manage pre-defined manufacturers for quick assignment when creating/editing assets"
      placeholder="e.g., Apple"
      entityLabel="Manufacturer"
      emptyStateMessage="No manufacturers defined yet. Add manufacturers to make asset management easier."
      noteMessage="Manufacturers with assets cannot be deleted. Reassign or delete the assets first."
  icon={ManufacturerIcon}
    />
  );
}
