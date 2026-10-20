import type { BuildingParameters, SimulationMetrics } from '../types';
import type { SimulationGeometry } from './types';

const STRUCTURE_FACTORS = {
  glulam_mass_timber: { gwp: 92, storage: 280, circularity: 88 },
  hybrid_timber_steel: { gwp: 185, storage: 140, circularity: 78 },
  low_carbon_concrete: { gwp: 260, storage: 25, circularity: 62 },
  recycled_structural_steel: { gwp: 295, storage: 0, circularity: 82 },
} as const;

const INSULATION_FACTORS = {
  mycelium_bio_composite: { gwp: 8, storage: 40, circularity: 5 },
  dense_pack_cellulose: { gwp: 15, storage: 25, circularity: 4 },
  wood_fiber: { gwp: 20, storage: 30, circularity: 3 },
  mineral_wool: { gwp: 45, storage: 0, circularity: 0 },
} as const;

export function calculateEmbodiedCarbon(
  parameters: BuildingParameters,
  geometry: SimulationGeometry,
): SimulationMetrics['embodiedCarbon'] {
  const structure = STRUCTURE_FACTORS[parameters.primaryStructure];
  const insulation = INSULATION_FACTORS[parameters.insulationType];
  const foundationGwp = parameters.primaryStructure === 'glulam_mass_timber' ? 65 : 110;
  const perSqMeter = Math.round(structure.gwp + insulation.gwp + foundationGwp);
  const storagePerSqMeter = structure.storage + insulation.storage;
  const circularityIndex = Math.min(100, structure.circularity + insulation.circularity);

  let rating: SimulationMetrics['embodiedCarbon']['rating'] = 'D';
  if (perSqMeter < 180) rating = 'A';
  else if (perSqMeter < 280) rating = 'B';
  else if (perSqMeter < 420) rating = 'C';

  return {
    totalKgCo2e: Math.round(perSqMeter * geometry.grossFloorAreaSqM),
    perSqMeter,
    rating,
    biogenicCarbonStoredKg: Math.round(storagePerSqMeter * geometry.grossFloorAreaSqM),
    circularityIndex,
  };
}