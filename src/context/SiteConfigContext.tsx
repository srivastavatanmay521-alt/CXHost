import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { defaultSiteConfig, type SiteConfig } from '../config.js';
import { readSiteConfig, resetSiteConfig, writeSiteConfig } from '../lib/siteConfig';

type SiteConfigContextValue = {
  config: SiteConfig;
  setConfig: Dispatch<SetStateAction<SiteConfig>>;
  resetConfig: () => void;
};

const SiteConfigContext = createContext<SiteConfigContextValue | undefined>(undefined);

export const SiteConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<SiteConfig>(() => {
    if (typeof window === 'undefined') {
      return defaultSiteConfig;
    }
    return readSiteConfig();
  });

  useEffect(() => {
    writeSiteConfig(config);
  }, [config]);

  const value = useMemo<SiteConfigContextValue>(() => ({
    config,
    setConfig,
    resetConfig: () => {
      resetSiteConfig();
      setConfig(defaultSiteConfig);
    },
  }), [config]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return context;
};
