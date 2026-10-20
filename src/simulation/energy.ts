import type { BuildingParameters, SimulationMetrics } from '../types';
import type { SimulationGeometry } from './types';

const GLAZING_U_FACTORS = {
  double_low_e: 1.6,
  triple_argon: 0.8,
  electrochromic: 1,
} as const;

export function calculateOperationalEnergy(
  parameters: BuildingParameters,
  geometry: SimulationGeometry,
): SimulationMetrics['operationalEnergy'] {
  const azimuthDifference = Math.abs(180 - parameters.orientationAzimuth);
  const solarExposurePenalty = (azimuthDifference / 180) * 12;
  const envelopeThermalLoss = parameters.windowToWallRatio * 42 * (GLAZING_U_FACTORS[parameters.glazingType] / 1.6);
  const louverOffset = Math.min(22, parameters.shadingLouverDepth * 18 * (1 - solarExposurePenalty / 30));
  const euiKwhPerSqMYear = Math.max(18, Number((87 + envelopeThermalLoss - louverOffset + solarExposurePenalty).toFixed(1)));
  const photovoltaicArea = geometry.roofArea * (parameters.photovoltaicCoverage / 100);
  const solarGenerationKwhYear = Math.round(photovoltaicArea * 210);
  const annualConsumption = euiKwhPerSqMYear * geometry.grossFloorAreaSqM;
  const netZeroReadinessPercent = Math.min(100, Math.round((solarGenerationKwhYear / annualConsumption) * 100));
  const annualEmissionsTonnes = Number(((annualConsumption - solarGenerationKwhYear) * 0.00028).toFixed(1));

  return {
    euiKwhPerSqMYear,
    annualEmissionsTonnes: Math.max(0, annualEmissionsTonnes),
    solarGenerationKwhYear,
    netZeroReadinessPercent,
  };
}