import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BusinessConfig } from '../types/config.types';
import * as configService from '../services/config.service';
import { useAuth } from './AuthContext';

interface ConfigContextValue {
  config: BusinessConfig | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configService.getConfig();
      setConfig(data);
    } catch {
      // Config fetch failed — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    } else {
      setConfig(null);
    }
  }, [isAuthenticated, refetch]);

  return (
    <ConfigContext.Provider value={{ config, loading, refetch }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
}
