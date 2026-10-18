export type BuildingTypology =
  | 'mass_timber_tower'
  | 'biophilic_podium'
  | 'courtyard_metabolism'
  | 'stepped_terrace';

export type GlazingType = 'double_low_e' | 'triple_argon' | 'electrochromic';

export type PrimaryStructureType =
  | 'glulam_mass_timber'
  | 'hybrid_timber_steel'
  | 'low_carbon_concrete'
  | 'recycled_structural_steel';

export type InsulationType =
  | 'mycelium_bio_composite'
  | 'dense_pack_cellulose'
  | 'wood_fiber'
  | 'mineral_wool';

export interface BuildingParameters {
  typology: BuildingTypology;
  floors: number;
  floorHeight: number; // meters
  footprintWidth: number; // meters
  footprintDepth: number; // meters
  baySpacing: number; // meters
  windowToWallRatio: number; // 0.1 to 0.9
  shadingLouverDepth: number; // meters (0.0 to 1.2)
  glazingType: GlazingType;
  primaryStructure: PrimaryStructureType;
  insulationType: InsulationType;
  greenRoofCoverage: number; // percentage 0 - 100
  photovoltaicCoverage: number; // percentage 0 - 100
  siteLocation: string;
  orientationAzimuth: number; // degrees 0 - 360
  explodedViewProgress: number; // 0 (assembled) to 1 (fully exploded)
}

export interface EmbodiedCarbonMetrics {
  totalKgCo2e: number;
  perSqMeter: number;
  rating: 'A' | 'B' | 'C' | 'D';
  biogenicCarbonStoredKg: number;
  circularityIndex: number; // 0 - 100
}

export interface OperationalEnergyMetrics {
  euiKwhPerSqMYear: number;
  annualEmissionsTonnes: number;
  solarGenerationKwhYear: number;
  netZeroReadinessPercent: number;
}

export interface DaylightMetrics {
  sda300_50: number; // Spatial Daylight Autonomy (%)
  ase1000_250: number; // Annual Sunlight Exposure (%)
  glareRiskPercent: number;
  naturalLuxAverage: number;
}

export interface StructuralMetrics {
  maxDeflectionMm: number;
  allowableDeflectionMm: number;
  lateralDriftRatio: string;
  safetyFactor: number;
  timberUtilizationRatio: number;
  status: 'compliant' | 'warning' | 'excessive';
}

export interface BiophilicMetrics {
  greenCoverSqM: number;
  stormwaterRetentionPercent: number;
  microclimateCoolingC: number;
  urbanBiodiversityScore: number;
}

export interface SimulationMetrics {
  grossFloorAreaSqM: number;
  buildingHeightM: number;
  embodiedCarbon: EmbodiedCarbonMetrics;
  operationalEnergy: OperationalEnergyMetrics;
  daylight: DaylightMetrics;
  structural: StructuralMetrics;
  biophilic: BiophilicMetrics;
  calculatedAt: string;
}

export type AgentId = 'architect' | 'engineer' | 'constructor' | 'ecologist';
export type AgentStatus = 'approved' | 'concern' | 'critical' | 'analyzing';

export interface ParameterTweak {
  parameter: keyof BuildingParameters | string;
  currentVal: string | number;
  suggestedVal: string | number;
  rationale: string;
  impactMetric: string;
}

export interface AgentDebateTurn {
  id: string;
  agentId: AgentId;
  roleName: string;
  roleTitle: string;
  avatarIcon: string;
  status: AgentStatus;
  headline: string;
  commentary: string;
  suggestedTweaks: ParameterTweak[];
  keyMetric: string;
  timestamp: number;
}

export interface MaterialInventoryItem {
  id: string;
  category: 'Substructure' | 'Superstructure' | 'Envelope' | 'Finishes' | 'Renewables';
  materialName: string;
  specification: string;
  quantity: number;
  unit: string;
  embodiedCarbonGwp: number; // kgCO2e per unit
  totalEmbodiedKgCo2: number;
  circularityScore: number; // 0 - 100
  recycledContentPercent: number;
  isLowCarbonAlternative: boolean;
  alternativeSuggestion?: {
    name: string;
    gwpDeltaPercent: number;
    costDeltaPercent: number;
    keyBenefit: string;
  };
}

export type ShaderMode = 'pbr' | 'solar' | 'daylight' | 'stress' | 'thermal';

export interface SystemsGraphNode {
  id: string;
  label: string;
  category: 'parameter' | 'agent' | 'simulation' | 'compliance';
  value: string | number;
  status?: 'good' | 'warning' | 'alert' | 'neutral';
  x: number;
  y: number;
}

export interface SystemsGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  active?: boolean;
}
