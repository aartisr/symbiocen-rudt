import type { BuildingParameters, SimulationMetrics } from '../types';
import { calculateBiophilicPerformance } from './biophilic';
import { calculateEmbodiedCarbon } from './carbon';
import { calculateDaylight } from './daylight';
import { calculateOperationalEnergy } from './energy';
import { calculateSimulationGeometry } from './geometry';
import { calculateStructuralPerformance } from './structural';
import type { SimulationCalculators, SimulationEngine } from './types';

export const DEFAULT_SIMULATION_CALCULATORS: SimulationCalculators = Object.freeze({
  geometry: calculateSimulationGeometry,
  embodiedCarbon: calculateEmbodiedCarbon,
  operationalEnergy: calculateOperationalEnergy,
  daylight: calculateDaylight,
  structural: calculateStructuralPerformance,
  biophilic: calculateBiophilicPerformance,
});

export class SurrogateSimulationEngine implements SimulationEngine {
  constructor(private readonly calculators: SimulationCalculators = DEFAULT_SIMULATION_CALCULATORS) {}

  simulate(parameters: BuildingParameters): SimulationMetrics {
    const geometry = this.calculators.geometry(parameters);
    return {
      grossFloorAreaSqM: geometry.grossFloorAreaSqM,
      buildingHeightM: geometry.buildingHeightM,
      embodiedCarbon: this.calculators.embodiedCarbon(parameters, geometry),
      operationalEnergy: this.calculators.operationalEnergy(parameters, geometry),
      daylight: this.calculators.daylight(parameters, geometry),
      structural: this.calculators.structural(parameters, geometry),
      biophilic: this.calculators.biophilic(parameters, geometry),
      calculatedAt: new Date().toISOString(),
    };
  }
}

export const defaultSimulationEngine = new SurrogateSimulationEngine();

export function calculateBuildingSimulation(parameters: BuildingParameters): SimulationMetrics {
  return defaultSimulationEngine.simulate(parameters);
}

export type { SimulationCalculators, SimulationEngine, SimulationGeometry } from './types';