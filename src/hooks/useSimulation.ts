import { useMemo } from 'react';
import { defaultSimulationEngine, type SimulationEngine } from '../simulation';
import type { BuildingParameters, MaterialInventoryItem, SimulationMetrics } from '../types';
import { generateMaterialInventory } from '../utils/physicsEngine';

export type MaterialInventoryProvider = (parameters: BuildingParameters) => MaterialInventoryItem[];

export interface SimulationSnapshot {
  metrics: SimulationMetrics;
  materials: MaterialInventoryItem[];
}

export function useSimulation(
  parameters: BuildingParameters,
  engine: SimulationEngine = defaultSimulationEngine,
  materialProvider: MaterialInventoryProvider = generateMaterialInventory,
): SimulationSnapshot {
  return useMemo(
    () => ({
      metrics: engine.simulate(parameters),
      materials: materialProvider(parameters),
    }),
    [engine, materialProvider, parameters],
  );
}