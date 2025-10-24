import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import type { MasterDataDefinition, MasterDataItem } from '../utils/masterData';

export interface UseMasterDataResult {
  items: MasterDataItem[];
  names: string[];
  addItem: (name: string) => MasterDataItem | null;
}

export function useMasterData(definition: MasterDataDefinition): UseMasterDataResult {
  const [items, setItems] = useState<MasterDataItem[]>(() => loadMasterData(definition));

  const syncFromStorage = useCallback(() => {
    const next = loadMasterData(definition);
    setItems((prev) => (areMasterDataItemsEqual(prev, next) ? prev : next));
  }, [definition]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === definition.storageKey) {
        syncFromStorage();
      }
    };

    window.addEventListener(definition.eventName, syncFromStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(definition.eventName, syncFromStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [definition, syncFromStorage]);

  const addItem = useCallback(
    (name: string) => {
      const normalized = normalizeMasterDataName(name ?? '');
      if (!normalized) {
        return null;
      }

      const canonical = canonicalMasterDataName(normalized);
      let created: MasterDataItem | null = null;

      setItems((prev) => {
        if (prev.some((item) => canonicalMasterDataName(item.name) === canonical)) {
          return prev;
        }

        const item = createMasterDataItem(normalized, definition);
        const next = sortMasterDataItems([...prev, item]);
        created = item;
        persistMasterData(definition, next);
        return next;
      });

      return created;
    },
    [definition]
  );

  const names = useMemo(
    () => sortMasterDataNames(mapMasterDataItemsToNames(items)),
    [items]
  );

  return {
    items,
    names,
    addItem,
  };
}

export function useMasterDataNames(definition: MasterDataDefinition): string[] {
  return useMasterData(definition).names;
}
