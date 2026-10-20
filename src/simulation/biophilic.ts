import type { BuildingParameters, SimulationMetrics } from '../types';
import type { SimulationGeometry } from './types';

export function calculateBiophilicPerformance(
  parameters: BuildingParameters,
  geometry: SimulationGeometry,
): SimulationMetrics['biophilic'] {
  return {
    greenCoverSqM: Math.round(geometry.roofArea * (parameters.greenRoofCoverage / 100) + geometry.singleFloorArea * 0.12),
    stormwaterRetentionPercent: Math.min(95, Math.round(30 + (parameters.greenRoofCoverage / 100) * 55)),
    microclimateCoolingC: Number(((parameters.greenRoofCoverage / 100) * 2.8 + (1 - parameters.windowToWallRatio) * 0.8).toFixed(1)),
    urbanBiodiversityScore: Math.min(100, Math.round(40 + (parameters.greenRoofCoverage / 100) * 45 + (parameters.typology === 'courtyard_metabolism' ? 15 : 0))),
  };
}