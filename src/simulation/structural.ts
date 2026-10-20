import type { BuildingParameters, SimulationMetrics } from '../types';
import type { SimulationGeometry } from './types';

const STIFFNESS_FACTORS = {
  glulam_mass_timber: 1,
  hybrid_timber_steel: 1.8,
  low_carbon_concrete: 2.2,
  recycled_structural_steel: 2.2,
} as const;

export function calculateStructuralPerformance(
  parameters: BuildingParameters,
  geometry: SimulationGeometry,
): SimulationMetrics['structural'] {
  const stiffness = STIFFNESS_FACTORS[parameters.primaryStructure];
  const maxDeflectionMm = Number(((Math.pow(geometry.buildingHeightM, 3) * 1.25 * 0.00018) / stiffness).toFixed(1));
  const allowableDeflectionMm = Number((geometry.buildingHeightM * 1000 / 400).toFixed(1));
  const driftRatio = Math.round(geometry.buildingHeightM * 1000 / Math.max(0.1, maxDeflectionMm));
  let status: SimulationMetrics['structural']['status'] = 'compliant';
  if (maxDeflectionMm > allowableDeflectionMm) status = 'excessive';
  else if (maxDeflectionMm > allowableDeflectionMm * 0.75) status = 'warning';

  return {
    maxDeflectionMm,
    allowableDeflectionMm,
    lateralDriftRatio: `H/${driftRatio}`,
    safetyFactor: Number(Math.max(1.1, 2.6 - (maxDeflectionMm / allowableDeflectionMm) * 0.9).toFixed(2)),
    timberUtilizationRatio: Number(Math.min(1.2, 0.45 + (parameters.floors / 32) * 0.48).toFixed(2)),
    status,
  };
}