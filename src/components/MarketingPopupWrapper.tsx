'use client';

import { useEffect, useState } from 'react';
import MarketingPopup from './MarketingPopup';
import { MarketingPopupConfig } from '@/lib/airtable';

export default function MarketingPopupWrapper() {
  const [config, setConfig] = useState<MarketingPopupConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/marketing-popup');
        if (!response.ok) {
          throw new Error('Failed to fetch popup configuration');
        }
        const popupConfig = await response.json();
        setConfig(popupConfig);
      } catch (err) {
        console.error('Error fetching popup config:', err);
        setError('Failed to load popup configuration');
      }
    };

    fetchConfig();
  }, []);

  if (error) {
    console.error('Marketing popup error:', error);
    return null;
  }

  if (!config) return null;

  return <MarketingPopup {...config} />;
} 