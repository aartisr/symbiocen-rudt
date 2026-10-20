import {
  BuildingParameters,
  MaterialInventoryItem,
} from '../types';

export { calculateBuildingSimulation } from '../simulation';

/**
 * Generate Dynamic EC3-Compliant Material Inventory (Bill of Materials)
 */
export function generateMaterialInventory(params: BuildingParameters): MaterialInventoryItem[] {
  const {
    floors,
    footprintWidth,
    footprintDepth,
    primaryStructure,
    insulationType,
    glazingType,
    windowToWallRatio,
    shadingLouverDepth,
    greenRoofCoverage,
    photovoltaicCoverage,
  } = params;

  const totalArea = footprintWidth * footprintDepth * floors;
  const facadeArea = 2 * (footprintWidth + footprintDepth) * (floors * params.floorHeight);
  const glazedArea = Math.round(facadeArea * windowToWallRatio);
  const opaqueArea = Math.round(facadeArea * (1 - windowToWallRatio));
  const roofArea = footprintWidth * footprintDepth;

  const items: MaterialInventoryItem[] = [];

  // 1. Substructure
  const concreteVol = Math.round(footprintWidth * footprintDepth * 0.8);
  const isLowCarbonFoundations = primaryStructure === 'glulam_mass_timber';
  items.push({
    id: 'mat-sub-1',
    category: 'Substructure',
    materialName: isLowCarbonFoundations ? 'Slag/Fly Ash Geopolymer Concrete' : 'Standard Portland Concrete C35/45',
    specification: isLowCarbonFoundations ? '70% GGBFS cement replacement pile caps' : 'ASTM C150 Type I/II foundation raft',
    quantity: concreteVol,
    unit: 'm³',
    embodiedCarbonGwp: isLowCarbonFoundations ? 115 : 295,
    totalEmbodiedKgCo2: concreteVol * (isLowCarbonFoundations ? 115 : 295),
    circularityScore: isLowCarbonFoundations ? 75 : 35,
    recycledContentPercent: isLowCarbonFoundations ? 65 : 12,
    isLowCarbonAlternative: isLowCarbonFoundations,
    alternativeSuggestion: isLowCarbonFoundations
      ? undefined
      : {
          name: 'Slag/Fly Ash Geopolymer Concrete (70% GGBS)',
          gwpDeltaPercent: -61,
          costDeltaPercent: +4,
          keyBenefit: 'Saves 180 kgCO2e/m³ using industrial slag byproduct.',
        },
  });

  // 2. Superstructure
  if (primaryStructure === 'glulam_mass_timber') {
    const glulamVol = Math.round(totalArea * 0.14);
    const cltArea = Math.round(totalArea * 0.95);
    items.push({
      id: 'mat-sup-1',
      category: 'Superstructure',
      materialName: 'Glulam Engineered Columns & Girders (GL28c)',
      specification: 'PEFC certified spruce European glulam structural framing',
      quantity: glulamVol,
      unit: 'm³',
      embodiedCarbonGwp: -410, // Net biogenic carbon accounting in sustainably managed timber
      totalEmbodiedKgCo2: glulamVol * -410,
      circularityScore: 92,
      recycledContentPercent: 0,
      isLowCarbonAlternative: true,
    });
    items.push({
      id: 'mat-sup-2',
      category: 'Superstructure',
      materialName: '5-Ply Cross-Laminated Timber (CLT) Floor Decks',
      specification: '160mm CLT floor diaphragm panels with non-toxic polyurethane resin',
      quantity: cltArea,
      unit: 'm²',
      embodiedCarbonGwp: -58,
      totalEmbodiedKgCo2: cltArea * -58,
      circularityScore: 90,
      recycledContentPercent: 0,
      isLowCarbonAlternative: true,
    });
  } else if (primaryStructure === 'hybrid_timber_steel') {
    const steelTonnes = Math.round(totalArea * 0.038);
    const cltArea = Math.round(totalArea * 0.85);
    items.push({
      id: 'mat-sup-1',
      category: 'Superstructure',
      materialName: 'Recycled Electric-Arc-Furnace Structural Steel Frame',
      specification: 'A992 steel wide-flange beams with 93% post-consumer scrap',
      quantity: steelTonnes,
      unit: 'tonnes',
      embodiedCarbonGwp: 480,
      totalEmbodiedKgCo2: steelTonnes * 480,
      circularityScore: 88,
      recycledContentPercent: 93,
      isLowCarbonAlternative: true,
    });
    items.push({
      id: 'mat-sup-2',
      category: 'Superstructure',
      materialName: '3-Ply CLT Composite Floor Panels',
      specification: '120mm CLT slabs acting compositely with steel beams',
      quantity: cltArea,
      unit: 'm²',
      embodiedCarbonGwp: -38,
      totalEmbodiedKgCo2: cltArea * -38,
      circularityScore: 85,
      recycledContentPercent: 0,
      isLowCarbonAlternative: true,
    });
  } else {
    const steelTonnes = Math.round(totalArea * 0.055);
    items.push({
      id: 'mat-sup-1',
      category: 'Superstructure',
      materialName: 'Virgin Basic Oxygen Steel Wide-Flange Shapes',
      specification: 'Standard structural grade S355 sections',
      quantity: steelTonnes,
      unit: 'tonnes',
      embodiedCarbonGwp: 1850,
      totalEmbodiedKgCo2: steelTonnes * 1850,
      circularityScore: 65,
      recycledContentPercent: 20,
      isLowCarbonAlternative: false,
      alternativeSuggestion: {
        name: 'Mass Glulam Timber GL28c Superstructure',
        gwpDeltaPercent: -88,
        costDeltaPercent: +2,
        keyBenefit: 'Locks 350+ tons of biogenic carbon while offering 2-hour natural char fire resistance.',
      },
    });
  }

  // 3. Envelope
  items.push({
    id: 'mat-env-1',
    category: 'Envelope',
    materialName: glazingType === 'triple_argon'
      ? 'Triple-Glazed Argon Insulated Glass Units (Low-E)'
      : glazingType === 'electrochromic'
      ? 'Dynamic Electrochromic Variable Tint Glass'
      : 'Double-Glazed Low-E Solar Control Glass',
    specification: `U-value: ${glazingType === 'triple_argon' ? '0.78' : '1.35'} W/m²K, SHGC: 0.28, thermally broken aluminum framing`,
    quantity: glazedArea,
    unit: 'm²',
    embodiedCarbonGwp: glazingType === 'triple_argon' ? 62 : 48,
    totalEmbodiedKgCo2: Math.round(glazedArea * (glazingType === 'triple_argon' ? 62 : 48)),
    circularityScore: 72,
    recycledContentPercent: 45,
    isLowCarbonAlternative: glazingType === 'triple_argon',
  });

  // Louvers
  if (shadingLouverDepth > 0) {
    const louverArea = Math.round(facadeArea * 0.35 * (shadingLouverDepth / 0.8));
    items.push({
      id: 'mat-env-2',
      category: 'Envelope',
      materialName: 'Architectural Terracotta Biophilic Sunshade Baguettes',
      specification: 'Natural fired clay extruded baguettes with stainless mechanical clips',
      quantity: louverArea,
      unit: 'm²',
      embodiedCarbonGwp: 18,
      totalEmbodiedKgCo2: Math.round(louverArea * 18),
      circularityScore: 95,
      recycledContentPercent: 30,
      isLowCarbonAlternative: true,
    });
  }

  // 4. Insulation & Finishes
  const insulationVol = Math.round(opaqueArea * 0.18);
  const isMycelium = insulationType === 'mycelium_bio_composite';
  items.push({
    id: 'mat-ins-1',
    category: 'Envelope',
    materialName: isMycelium
      ? 'Grown Mycelium Bio-Composite Thermal Infill'
      : insulationType === 'dense_pack_cellulose'
      ? 'Recycled Post-Consumer Borate-Treated Cellulose'
      : 'Extruded Polystyrene (XPS) Foam Board',
    specification: isMycelium
      ? 'Agricultural waste inoculated with Pleurotus ostreatus mycelium, R-3.8/inch'
      : 'Blown newspaper fibers with non-toxic flame retardants',
    quantity: insulationVol,
    unit: 'm³',
    embodiedCarbonGwp: isMycelium ? -18 : insulationType === 'dense_pack_cellulose' ? 12 : 98,
    totalEmbodiedKgCo2: Math.round(insulationVol * (isMycelium ? -18 : insulationType === 'dense_pack_cellulose' ? 12 : 98)),
    circularityScore: isMycelium ? 98 : 88,
    recycledContentPercent: isMycelium ? 100 : 85,
    isLowCarbonAlternative: isMycelium || insulationType === 'dense_pack_cellulose',
    alternativeSuggestion: isMycelium
      ? undefined
      : {
          name: 'Grown Mycelium Thermal Insulation',
          gwpDeltaPercent: -90,
          costDeltaPercent: -5,
          keyBenefit: 'Fully compostable cradle-to-cradle bio-based insulation that consumes agricultural waste.',
        },
  });

  // 5. Renewables & Roof
  if (photovoltaicCoverage > 0) {
    const pvPanelArea = Math.round(roofArea * (photovoltaicCoverage / 100));
    items.push({
      id: 'mat-ren-1',
      category: 'Renewables',
      materialName: 'Bifacial Monocrystalline Silicon Photovoltaic Array',
      specification: '420W Tier-1 high efficiency panels with microinverters (21.8% module efficiency)',
      quantity: pvPanelArea,
      unit: 'm²',
      embodiedCarbonGwp: 145,
      totalEmbodiedKgCo2: Math.round(pvPanelArea * 145),
      circularityScore: 68,
      recycledContentPercent: 35,
      isLowCarbonAlternative: true,
    });
  }

  if (greenRoofCoverage > 0) {
    const greenArea = Math.round(roofArea * (greenRoofCoverage / 100));
    items.push({
      id: 'mat-ren-2',
      category: 'Renewables',
      materialName: 'Extensive Sedum & Native Grass Living Roof Matrix',
      specification: '120mm engineered substrate with drainage mat and root barrier',
      quantity: greenArea,
      unit: 'm²',
      embodiedCarbonGwp: 14,
      totalEmbodiedKgCo2: Math.round(greenArea * 14),
      circularityScore: 96,
      recycledContentPercent: 80,
      isLowCarbonAlternative: true,
    });
  }

  return items;
}
