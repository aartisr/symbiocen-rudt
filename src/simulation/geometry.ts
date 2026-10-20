import type { BuildingParameters } from '../types';
import type { SimulationGeometry } from './types';

const TYPOLOGY_AREA_MODIFIERS = {
  mass_timber_tower: 1,
  courtyard_metabolism: 0.72,
  stepped_terrace: 0.82,
  biophilic_podium: 0.88,
} as const;

export function calculateSimulationGeometry(parameters: BuildingParameters): SimulationGeometry {
  const areaModifier = TYPOLOGY_AREA_MODIFIERS[parameters.typology];
  const singleFloorArea = parameters.footprintWidth * parameters.footprintDepth * areaModifier;

  return {
    areaModifier,
    singleFloorArea,
    roofArea: parameters.footprintWidth * parameters.footprintDepth * areaModifier,
    grossFloorAreaSqM: Math.round(singleFloorArea * parameters.floors),
    buildingHeightM: Number((parameters.floors * parameters.floorHeight).toFixed(1)),
  };
}