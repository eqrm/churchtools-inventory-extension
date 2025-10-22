import { useState, useEffect } from 'react';

/**
 * Hook to manage manufacturer and model data with localStorage persistence
 * Used by CreatableSelect components for manufacturer and model fields
 */
export function useManufacturerModelData() {
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedManufacturers = localStorage.getItem('assetManufacturers');
      const storedModels = localStorage.getItem('assetModels');

      if (storedManufacturers) {
        setManufacturers(JSON.parse(storedManufacturers));
      }

      if (storedModels) {
        setModels(JSON.parse(storedModels));
      }
    } catch (error) {
      console.warn('Failed to load manufacturer/model data from localStorage:', error);
    }
  }, []);

  // Save manufacturers to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('assetManufacturers', JSON.stringify(manufacturers));
    } catch (error) {
      console.warn('Failed to save manufacturers to localStorage:', error);
    }
  }, [manufacturers]);

  // Save models to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('assetModels', JSON.stringify(models));
    } catch (error) {
      console.warn('Failed to save models to localStorage:', error);
    }
  }, [models]);

  const addManufacturer = (manufacturer: string) => {
    if (manufacturer && !manufacturers.includes(manufacturer)) {
      setManufacturers(prev => [...prev, manufacturer].sort());
    }
  };

  const addModel = (model: string) => {
    if (model && !models.includes(model)) {
      setModels(prev => [...prev, model].sort());
    }
  };

  return {
    manufacturers,
    models,
    addManufacturer,
    addModel,
  };
}