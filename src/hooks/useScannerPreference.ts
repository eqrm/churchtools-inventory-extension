import { useState, useEffect } from 'react';

/**
 * Hook to persist scanner preference in localStorage
 * Used by QuickScanModal to remember the last selected scanner
 */
export function useScannerPreference() {
  const [preferredScannerId, setPreferredScannerId] = useState<string | null>(null);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('preferredScannerId');
      if (stored) {
        setPreferredScannerId(stored);
      }
    } catch (error) {
      console.warn('Failed to load scanner preference from localStorage:', error);
    }
  }, []);

  // Save preference to localStorage whenever it changes
  useEffect(() => {
    try {
      if (preferredScannerId) {
        localStorage.setItem('preferredScannerId', preferredScannerId);
      } else {
        localStorage.removeItem('preferredScannerId');
      }
    } catch (error) {
      console.warn('Failed to save scanner preference to localStorage:', error);
    }
  }, [preferredScannerId]);

  const setPreference = (scannerId: string | null) => {
    setPreferredScannerId(scannerId);
  };

  const clearPreference = () => {
    setPreferredScannerId(null);
  };

  return {
    preferredScannerId,
    setPreference,
    clearPreference,
  };
}