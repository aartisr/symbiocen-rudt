import type {
  AgentDebateTurn,
  BuildingParameters,
  BuildingTypology,
  InsulationType,
  PrimaryStructureType,
} from '../types';

export const DEFAULT_BUILDING_PARAMETERS: BuildingParameters = {
  typology: 'mass_timber_tower',
  floors: 12,
  floorHeight: 3.8,
  footprintWidth: 32,
  footprintDepth: 28,
  baySpacing: 6,
  windowToWallRatio: 0.45,
  shadingLouverDepth: 0.5,
  glazingType: 'triple_argon',
  primaryStructure: 'glulam_mass_timber',
  insulationType: 'mycelium_bio_composite',
  greenRoofCoverage: 70,
  photovoltaicCoverage: 65,
  siteLocation: 'Boston Seaport Innovation District (Zone 5A)',
  orientationAzimuth: 180,
  explodedViewProgress: 0,
};

export const SITE_OPTIONS = [
  { name: 'Boston Seaport Innovation District', zone: 'Climate Zone 5A · BERDO 2.0 & MA Stretch Code', wind: '1.25 kPa prevailing sea winds' },
  { name: 'Flint Riverfront Regenerative Hub', zone: 'Climate Zone 5A · Michigan Energy Efficiency Code', wind: '0.95 kPa continental winds' },
  { name: 'Seattle Waterfront Mixed-Use', zone: 'Climate Zone 4C · Washington Clean Buildings Act', wind: '1.10 kPa coastal maritime' },
  { name: 'Denver RiNo Biophilic District', zone: 'Climate Zone 5B · High Altitude Solar Envelope', wind: '1.30 kPa mountain downdrafts' },
] as const;

export const TYPOLOGY_OPTIONS: ReadonlyArray<{ id: BuildingTypology; label: string; description: string }> = [
  { id: 'mass_timber_tower', label: 'Mass Timber Tower', description: 'Compact vertical core with timber column grid' },
  { id: 'stepped_terrace', label: 'Stepped Biophilic Terraces', description: 'Terraced roof gardens reducing wind shear' },
  { id: 'biophilic_podium', label: 'Biophilic Podium', description: 'Active street-level atrium with slender tower' },
  { id: 'courtyard_metabolism', label: 'Courtyard Metabolism', description: 'Central open microclimate light courtyard' },
];

export const STRUCTURE_OPTIONS: ReadonlyArray<{ id: PrimaryStructureType; label: string; gwp: string; description: string }> = [
  { id: 'glulam_mass_timber', label: 'Glulam Timber & CLT (Biogenic)', gwp: '92 kgCO₂e/m²', description: 'European spruce timber locking 280 kgCO₂/m²' },
  { id: 'hybrid_timber_steel', label: 'Hybrid Timber & Recycled Steel', gwp: '185 kgCO₂e/m²', description: '93% scrap electric arc steel with CLT decks' },
  { id: 'low_carbon_concrete', label: 'Low-Carbon Geopolymer Concrete', gwp: '260 kgCO₂e/m²', description: '70% slag byproduct cement replacement' },
  { id: 'recycled_structural_steel', label: 'Recycled Structural Steel Framing', gwp: '295 kgCO₂e/m²', description: 'Moment frames with lightweight deck system' },
];

export const INSULATION_OPTIONS: ReadonlyArray<{ id: InsulationType; label: string; performance: string }> = [
  { id: 'mycelium_bio_composite', label: 'Mycelium Bio-Composite', performance: 'R-3.8/in · Carbon Negative' },
  { id: 'dense_pack_cellulose', label: 'Dense-Pack Recycled Cellulose', performance: 'R-3.7/in · 85% Recycled' },
  { id: 'wood_fiber', label: 'Continuous Wood Fiber Board', performance: 'R-3.6/in · Carbon Storing' },
  { id: 'mineral_wool', label: 'Standard Mineral Basalt Wool', performance: 'R-4.2/in · Fire Incombustible' },
];

export function createInitialDebateTurns(now = Date.now()): AgentDebateTurn[] {
  return [
    {
      id: 'init-arch', agentId: 'architect', roleName: 'Elena Rostova, AIA', roleTitle: 'Lead Design Architect', avatarIcon: 'Compass', status: 'approved', headline: 'Biophilic Massing & Solar Glazing',
      commentary: 'The south-facing orientation and 45% glazing ratio provide generous natural illumination across perimeter study labs while terracotta louvers mitigate unwanted summer solar thermal gain.',
      keyMetric: '72% sDA Daylight', timestamp: now - 3600000,
      suggestedTweaks: [{ parameter: 'shadingLouverDepth', currentVal: '0.5m', suggestedVal: '0.7m', rationale: 'Extending louvers by 0.2m protects southern exposures during mid-day solar peak.', impactMetric: '+6% Glare Comfort' }],
    },
    {
      id: 'init-eng', agentId: 'engineer', roleName: 'Marcus Vance, PE, SE', roleTitle: 'Senior Structural & MEP Engineer', avatarIcon: 'Activity', status: 'approved', headline: 'Structural Timber Lateral Rigidity',
      commentary: 'Glulam post-and-beam columns combined with 5-ply CLT diaphragms easily satisfy gravity loads. Lateral wind drift deflection is verified well within the H/400 structural standard.',
      keyMetric: 'Drift H/480 (Safe)', timestamp: now - 3500000,
      suggestedTweaks: [{ parameter: 'baySpacing', currentVal: '6.0m', suggestedVal: '7.2m', rationale: 'Increasing bay spacing to 7.2m standardizes timber spans and reduces total column count by 16%.', impactMetric: '-8% Timber Volume' }],
    },
    {
      id: 'init-con', agentId: 'constructor', roleName: 'David Chen, CCM', roleTitle: 'Virtual Construction Manager', avatarIcon: 'Layers', status: 'approved', headline: 'Modular Prefabrication Speed',
      commentary: 'Factory CNC prefabrication of timber connections enables quiet, crane-assisted dry erection on site, eliminating concrete curing delays and reducing urban neighborhood noise.',
      keyMetric: '30% Faster Erection', timestamp: now - 3400000, suggestedTweaks: [],
    },
    {
      id: 'init-eco', agentId: 'ecologist', roleName: 'Dr. Soraya Morales', roleTitle: 'Regenerative Systems Ecologist', avatarIcon: 'Leaf', status: 'approved', headline: 'Net Negative Biogenic Carbon Sink',
      commentary: 'Specifying sustainably harvested mass timber and mycelium insulation sequesters hundreds of metric tonnes of atmospheric CO₂ inside the structural fabric, qualifying for Grade A carbon ranking.',
      keyMetric: '92 kgCO₂e/m²', timestamp: now - 3300000,
      suggestedTweaks: [{ parameter: 'greenRoofCoverage', currentVal: '70%', suggestedVal: '85%', rationale: 'Expanding sedum cover maximizes stormwater retention and provides urban pollinator stepping stones.', impactMetric: '+15% Stormwater Retention' }],
    },
  ];
}