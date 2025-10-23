import { useEffect, useMemo, useState } from 'react';
import {
  MASTER_DATA_DEFINITIONS,
  areMasterDataItemsEqual,
  canonicalMasterDataName,
  createMasterDataItem,
  loadMasterData,
  mapMasterDataItemsToNames,
  normalizeMasterDataName,
  persistMasterData,
  sortMasterDataItems,
  sortMasterDataNames,
} from '../utils/masterData';
import type { MasterDataItem } from '../utils/masterData';

const MANUFACTURER_DEFINITION = MASTER_DATA_DEFINITIONS.manufacturers;
const MODEL_DEFINITION = MASTER_DATA_DEFINITIONS.models;

function toNameList(items: MasterDataItem[]): string[] {
  return sortMasterDataNames(mapMasterDataItemsToNames(items));
}

/**
 * Hook to manage manufacturer and model data with localStorage persistence.
 * Used by CreatableSelect components for manufacturer and model fields.
 */
export function useManufacturerModelData() {
  const [manufacturerItems, setManufacturerItems] = useState<MasterDataItem[]>(() =>
    loadMasterData(MANUFACTURER_DEFINITION)
  );
  const [modelItems, setModelItems] = useState<MasterDataItem[]>(() =>
    loadMasterData(MODEL_DEFINITION)
  );

  useEffect(() => {
    const syncManufacturers = () => {
      const next = loadMasterData(MANUFACTURER_DEFINITION);
      setManufacturerItems((prev) => (areMasterDataItemsEqual(prev, next) ? prev : next));
    };

    const syncModels = () => {
      const next = loadMasterData(MODEL_DEFINITION);
      setModelItems((prev) => (areMasterDataItemsEqual(prev, next) ? prev : next));
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === MANUFACTURER_DEFINITION.storageKey) {
        syncManufacturers();
      }
      if (!event.key || event.key === MODEL_DEFINITION.storageKey) {
        syncModels();
      }
    };

    window.addEventListener(MANUFACTURER_DEFINITION.eventName, syncManufacturers);
    window.addEventListener(MODEL_DEFINITION.eventName, syncModels);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(MANUFACTURER_DEFINITION.eventName, syncManufacturers);
      window.removeEventListener(MODEL_DEFINITION.eventName, syncModels);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const manufacturers = useMemo(() => toNameList(manufacturerItems), [manufacturerItems]);
  const models = useMemo(() => toNameList(modelItems), [modelItems]);

  const addManufacturer = (manufacturer: string) => {
    const normalized = normalizeMasterDataName(manufacturer ?? '');
    if (!normalized) return;

    setManufacturerItems((prev) => {
      const canonical = canonicalMasterDataName(normalized);
      if (prev.some((item) => canonicalMasterDataName(item.name) === canonical)) {
        return prev;
      }

      const next = sortMasterDataItems([
        ...prev,
        createMasterDataItem(normalized, MANUFACTURER_DEFINITION),
      ]);

      persistMasterData(MANUFACTURER_DEFINITION, next);
      return next;
    });
  };

  const addModel = (model: string) => {
    const normalized = normalizeMasterDataName(model ?? '');
    if (!normalized) return;

    setModelItems((prev) => {
      const canonical = canonicalMasterDataName(normalized);
      if (prev.some((item) => canonicalMasterDataName(item.name) === canonical)) {
        return prev;
      }

      const next = sortMasterDataItems([
        ...prev,
        createMasterDataItem(normalized, MODEL_DEFINITION),
      ]);

      persistMasterData(MODEL_DEFINITION, next);
      return next;
    });
  };

  return {
    manufacturers,
    models,
    addManufacturer,
    addModel,
  };
}