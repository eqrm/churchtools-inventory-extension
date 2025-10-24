import { mdiLaptop } from '@mdi/js';
import { MasterDataSettingsBase } from './MasterDataSettingsBase';
import { MASTER_DATA_DEFINITIONS } from '../../utils/masterData';
import { createMdiIconComponent } from '../../utils/mdiIconFactory';

const ModelIcon = createMdiIconComponent(mdiLaptop);

export function ModelSettings() {
  return (
    <MasterDataSettingsBase
      definition={MASTER_DATA_DEFINITIONS.models}
      title="Model Management"
      description="Manage known model names used when creating assets"
      placeholder="e.g., MacBook Pro"
      entityLabel="Model"
      emptyStateMessage="No models defined yet. Add models to speed up asset entry."
      noteMessage="Models with assets cannot be deleted. Reassign or delete the assets first."
  icon={ModelIcon}
    />
  );
}
