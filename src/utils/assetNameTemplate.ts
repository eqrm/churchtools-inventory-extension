export const DEFAULT_ASSET_NAME_TEMPLATE = '%Manufacturer% %Model% %Asset Number%';

/**
 * Generate an asset name from a template using placeholders of the form %Placeholder%
 * The replacement keys are matched case-insensitively and spaces inside the placeholder
 * are allowed (e.g. %Model Name%). If a placeholder isn't found in the data map it
 * will be replaced with an empty string.
 */
export function generateAssetNameFromTemplate(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  if (!template) return '';

  return template.replace(/%([^%]+)%/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    // try case-insensitive match
    const foundKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
    const value = foundKey ? data[foundKey] : data[key];
    return value === undefined || value === null ? '' : String(value);
  })
  // collapse multiple spaces
  .replace(/\s+/g, ' ')
  .trim();
}
