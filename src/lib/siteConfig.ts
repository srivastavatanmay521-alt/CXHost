import { configStorageKey, defaultSiteConfig, type SiteConfig } from '../config.js';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeDeep = <T>(base: T, override: unknown): T => {
  if (!isObject(base) || !isObject(override)) {
    return (override as T) ?? base;
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (Array.isArray(value)) {
      result[key] = value;
    } else if (isObject(baseValue) && isObject(value)) {
      result[key] = mergeDeep(baseValue, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

export const readSiteConfig = (): SiteConfig => {
  if (typeof window === 'undefined') {
    return defaultSiteConfig;
  }

  try {
    const raw = window.localStorage.getItem(configStorageKey);
    if (!raw) {
      return defaultSiteConfig;
    }
    return mergeDeep(defaultSiteConfig, JSON.parse(raw));
  } catch {
    return defaultSiteConfig;
  }
};

export const writeSiteConfig = (config: SiteConfig) => {
  window.localStorage.setItem(configStorageKey, JSON.stringify(config));
};

export const resetSiteConfig = () => {
  window.localStorage.removeItem(configStorageKey);
};

export const updateConfigInStorage = (updater: (current: SiteConfig) => SiteConfig) => {
  const updated = updater(readSiteConfig());
  writeSiteConfig(updated);
  return updated;
};
