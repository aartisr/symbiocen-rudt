import { DEFAULT_BUILDING_PARAMETERS } from '../config/design';
import type { BuildingParameters, MaterialInventoryItem, ParameterTweak } from '../types';
import type { ClimateStrategyRecommendation } from '../utils/climateData';

const PARAMETER_KEYS = new Set<keyof BuildingParameters>(
  Object.keys(DEFAULT_BUILDING_PARAMETERS) as Array<keyof BuildingParameters>,
);

export function isBuildingParameter(value: string): value is keyof BuildingParameters {
  return PARAMETER_KEYS.has(value as keyof BuildingParameters);
}

export function parseParameterValue(value: string | number): string | number {
  if (typeof value !== 'string') return value;
  if (value.endsWith('m')) return Number.parseFloat(value);
  if (value.endsWith('%')) return Number.parseInt(value, 10);
  return value;
}

export function applyParameterTweak(parameters: BuildingParameters, tweak: ParameterTweak): BuildingParameters {
  const parameter = String(tweak.parameter);
  if (!isBuildingParameter(parameter)) return parameters;
  return { ...parameters, [parameter]: parseParameterValue(tweak.suggestedVal) };
}

export function applyClimateStrategy(parameters: BuildingParameters, strategy: ClimateStrategyRecommendation): BuildingParameters {
  return {
    ...parameters,
    typology: strategy.recommendedTypology,
    orientationAzimuth: strategy.recommendedOrientationAzimuth,
    windowToWallRatio: strategy.recommendedWWR,
    shadingLouverDepth: strategy.recommendedLouverDepth,
    glazingType: strategy.recommendedGlazing,
    insulationType: strategy.recommendedInsulation,
    primaryStructure: strategy.recommendedPrimaryStructure,
    greenRoofCoverage: strategy.recommendedGreenRoofCoverage,
    photovoltaicCoverage: strategy.recommendedPvCoverage,
  };
}

export function applyMaterialAlternative(parameters: BuildingParameters, item: MaterialInventoryItem): BuildingParameters {
  if (item.category === 'Substructure' || item.category === 'Superstructure') {
    return { ...parameters, primaryStructure: 'glulam_mass_timber' };
  }
  if (item.category === 'Envelope') {
    return { ...parameters, insulationType: 'mycelium_bio_composite' };
  }
  return parameters;
}