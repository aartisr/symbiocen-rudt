import type { BuildingParameters, SimulationMetrics } from '../types';
import type { SimulationGeometry } from './types';

export function calculateDaylight(
  parameters: BuildingParameters,
  _geometry: SimulationGeometry,
): SimulationMetrics['daylight'] {
  const depthPenalty = Math.max(0, (Math.min(parameters.footprintWidth, parameters.footprintDepth) - 20) * 1.5);
  const rawSda = Math.min(94, Math.max(30, 45 + parameters.windowToWallRatio * 90 - depthPenalty - parameters.shadingLouverDepth * 12));
  const sda300_50 = Math.round(rawSda);
  const ase1000_250 = Math.round(Math.min(35, Math.max(4, parameters.windowToWallRatio * 32 - parameters.shadingLouverDepth * 16)));

  return {
    sda300_50,
    ase1000_250,
    glareRiskPercent: Math.round(Math.max(2, ase1000_250 * 0.9)),
    naturalLuxAverage: Math.round(380 + (sda300_50 / 100) * 450),
  };
}