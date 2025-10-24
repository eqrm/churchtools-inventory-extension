/**
 * Application-wide constants derived from environment variables
 */

import { getDevModeFlag, getExtensionKey } from '../utils/extensionKey';

export const KEY = getExtensionKey();
export const DEV_MODE = getDevModeFlag();
export const MODULE_ID = import.meta.env.VITE_MODULE_ID;
