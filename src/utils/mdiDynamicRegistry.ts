import type { CategoryIconOption } from './iconMigrationMap';

export type MdiModule = Record<string, string>;

let mdiModulePromise: Promise<MdiModule> | null = null;
let allOptionsPromise: Promise<CategoryIconOption[]> | null = null;
const dynamicIconCache = new Map<string, CategoryIconOption>();

function loadMdiModule(): Promise<MdiModule> {
  if (!mdiModulePromise) {
    mdiModulePromise = import('@mdi/js').then((module) => {
      const result: MdiModule = {};
      for (const [key, value] of Object.entries(module)) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      }
      return result;
    });
  }
  return mdiModulePromise;
}

function capitalize(part: string): string {
  if (!part) return part;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function pascalToKebab(pascal: string): string {
  const withHyphen = pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2');
  return withHyphen.toLowerCase();
}

function valueToSymbol(value: string): string | undefined {
  if (!value.startsWith('mdi:')) {
    return undefined;
  }
  const name = value.slice(4);
  if (!/^[-a-z0-9]+$/.test(name)) {
    return undefined;
  }
  const parts = name.split('-');
  const pascal = parts.map(capitalize).join('');
  return `mdi${pascal}`;
}

function symbolToValue(symbol: string): string | undefined {
  if (!symbol.startsWith('mdi')) {
    return undefined;
  }
  const pascal = symbol.slice(3);
  if (!pascal) {
    return undefined;
  }
  return `mdi:${pascalToKebab(pascal)}`;
}

function labelFromValue(value: string): string {
  const name = value.startsWith('mdi:') ? value.slice(4) : value;
  return name
    .split('-')
    .map(capitalize)
    .join(' ');
}

function buildKeywords(value: string, symbol: string, label: string): string[] {
  const name = value.slice(4);
  const parts = name.split('-');
  const baseKeywords = new Set<string>();
  baseKeywords.add(name);
  baseKeywords.add(name.replace(/-/g, ' '));
  baseKeywords.add(symbol);
  baseKeywords.add(label);
  parts.forEach((part) => {
    if (part) {
      baseKeywords.add(part);
    }
  });
  return Array.from(baseKeywords);
}

function buildOption(symbol: string, path: string): CategoryIconOption | undefined {
  const value = symbolToValue(symbol);
  if (!value) {
    return undefined;
  }
  const label = labelFromValue(value);
  const option: CategoryIconOption = {
    value,
    label,
    path,
    keywords: buildKeywords(value, symbol, label),
  };
  dynamicIconCache.set(value, option);
  return option;
}

async function ensureAllOptions(): Promise<CategoryIconOption[]> {
  if (!allOptionsPromise) {
    allOptionsPromise = loadMdiModule().then((module) => {
      const options: CategoryIconOption[] = [];
      for (const [symbol, path] of Object.entries(module)) {
        if (!symbol.startsWith('mdi') || typeof path !== 'string') {
          continue;
        }
        const option = buildOption(symbol, path);
        if (option) {
          options.push(option);
        }
      }
      return options;
    });
  }
  return allOptionsPromise;
}

export function getCachedIconOption(value: string): CategoryIconOption | undefined {
  return dynamicIconCache.get(value);
}

export async function ensureIconOption(value: string): Promise<CategoryIconOption | undefined> {
  if (!value.startsWith('mdi:')) {
    return undefined;
  }
  if (dynamicIconCache.has(value)) {
    return dynamicIconCache.get(value);
  }
  const symbol = valueToSymbol(value);
  if (!symbol) {
    return undefined;
  }
  const module = await loadMdiModule();
  const path = module[symbol];
  if (typeof path !== 'string') {
    return undefined;
  }
  return buildOption(symbol, path);
}

export async function searchIconOptions(term: string, limit = 80): Promise<CategoryIconOption[]> {
  const query = term.trim().toLowerCase();
  if (!query) {
    return [];
  }
  const options = await ensureAllOptions();
  const matches: CategoryIconOption[] = [];
  for (const option of options) {
    const haystackParts = [option.label, option.value.slice(4).replace(/-/g, ' '), ...option.keywords];
    const haystack = haystackParts.join(' ').toLowerCase();
    if (haystack.includes(query)) {
      matches.push(option);
    }
    if (matches.length >= limit) {
      break;
    }
  }
  return matches;
}

export function deriveLabelFromValue(value: string): string {
  return labelFromValue(value);
}

export function isLikelyMdiValue(value?: string): boolean {
  if (!value) {
    return false;
  }
  if (!value.startsWith('mdi:')) {
    return false;
  }
  const name = value.slice(4);
  return /^[-a-z0-9]+$/.test(name);
}

export function cacheIconOption(option: CategoryIconOption): void {
  dynamicIconCache.set(option.value, option);
}
