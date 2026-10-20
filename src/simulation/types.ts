import type { BuildingParameters, SimulationMetrics } from '../types';

export interface SimulationGeometry {
  areaModifier: number;
  singleFloorArea: number;
  roofArea: number;
  grossFloorAreaSqM: number;
  buildingHeightM: number;
}

export interface SimulationEngine {
  simulate(parameters: BuildingParameters): SimulationMetrics;
}

export interface SimulationCalculators {
  geometry(parameters: BuildingParameters): SimulationGeometry;
  embodiedCarbon(parameters: BuildingParameters, geometry: SimulationGeometry): SimulationMetrics['embodiedCarbon'];
  operationalEnergy(parameters: BuildingParameters, geometry: SimulationGeometry): SimulationMetrics['operationalEnergy'];
  daylight(parameters: BuildingParameters, geometry: SimulationGeometry): SimulationMetrics['daylight'];
  structural(parameters: BuildingParameters, geometry: SimulationGeometry): SimulationMetrics['structural'];
  biophilic(parameters: BuildingParameters, geometry: SimulationGeometry): SimulationMetrics['biophilic'];
}