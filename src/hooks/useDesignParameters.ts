import { useCallback, useState } from 'react';
import { DEFAULT_BUILDING_PARAMETERS } from '../config/design';
import { applyClimateStrategy, applyMaterialAlternative, applyParameterTweak } from '../domain/parameterUpdates';
import type { BuildingParameters, MaterialInventoryItem, ParameterTweak } from '../types';
import type { ClimateStrategyRecommendation } from '../utils/climateData';

export function useDesignParameters(initialParameters = DEFAULT_BUILDING_PARAMETERS) {
  const [parameters, setParameters] = useState<BuildingParameters>(initialParameters);

  const updateParameter = useCallback(
    <Key extends keyof BuildingParameters>(key: Key, value: BuildingParameters[Key]) => {
      setParameters((current) => ({ ...current, [key]: value }));
    },
    [],
  );
  const applyTweak = useCallback((tweak: ParameterTweak) => {
    setParameters((current) => applyParameterTweak(current, tweak));
  }, []);
  const applyStrategy = useCallback((strategy: ClimateStrategyRecommendation) => {
    setParameters((current) => applyClimateStrategy(current, strategy));
  }, []);
  const applyAlternative = useCallback((item: MaterialInventoryItem) => {
    setParameters((current) => applyMaterialAlternative(current, item));
  }, []);

  return { parameters, updateParameter, applyTweak, applyStrategy, applyAlternative };
}