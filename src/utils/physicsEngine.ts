import {
  BuildingParameters,
  SimulationMetrics,
  MaterialInventoryItem,
} from '../types';

/**
 * Surrogate Physics & Carbon Simulation Engine
 * Emulates high-speed finite-element, thermal envelope, and LCA models
 * for real-time parametric feedback within <10ms.
 */
export function calculateBuildingSimulation(params: BuildingParameters): SimulationMetrics {
  const {
    typology,
    floors,
    floorHeight,
    footprintWidth,
    footprintDepth,
    windowToWallRatio,
    shadingLouverDepth,
    glazingType,
    primaryStructure,
    insulationType,
    greenRoofCoverage,
    photovoltaicCoverage,
    orientationAzimuth,
  } = params;

  // Typology massing modifier
  let areaModifier = 1.0;
  if (typology === 'courtyard_metabolism') {
    areaModifier = 0.72; // Central open bioclimatic courtyard
  } else if (typology === 'stepped_terrace') {
    areaModifier = 0.82; // Stepped massing terraces
  } else if (typology === 'biophilic_podium') {
    areaModifier = 0.88; // Porous podium with open atrium
  }

  const singleFloorArea = footprintWidth * footprintDepth * areaModifier;
  const grossFloorAreaSqM = Math.round(singleFloorArea * floors);
  const buildingHeightM = Number((floors * floorHeight).toFixed(1));

  // --- Embodied Carbon Calculations (kgCO2e/m2) ---
  // Baseline benchmarks (EC3 / CLF):
  // Concrete baseline: ~380 kgCO2e/m2
  // Recycled steel baseline: ~310 kgCO2e/m2
  // Hybrid timber/steel: ~180 kgCO2e/m2
  // Mass timber: ~95 kgCO2e/m2 (with net negative biogenic sequestration accounted)
  let structuralGwpRate = 380;
  let biogenicStoragePerM2 = 0;
  let circularityScore = 55;

  if (primaryStructure === 'glulam_mass_timber') {
    structuralGwpRate = 92;
    biogenicStoragePerM2 = 280; // kgCO2 sequestered in engineered wood
    circularityScore = 88;
  } else if (primaryStructure === 'hybrid_timber_steel') {
    structuralGwpRate = 185;
    biogenicStoragePerM2 = 140;
    circularityScore = 78;
  } else if (primaryStructure === 'low_carbon_concrete') {
    structuralGwpRate = 260;
    biogenicStoragePerM2 = 25;
    circularityScore = 62;
  } else if (primaryStructure === 'recycled_structural_steel') {
    structuralGwpRate = 295;
    biogenicStoragePerM2 = 0;
    circularityScore = 82;
  }

  // Envelope and Insulation modifiers
  let insulationGwpRate = 45;
  if (insulationType === 'mycelium_bio_composite') {
    insulationGwpRate = 8;
    biogenicStoragePerM2 += 40;
    circularityScore += 5;
  } else if (insulationType === 'dense_pack_cellulose') {
    insulationGwpRate = 15;
    biogenicStoragePerM2 += 25;
    circularityScore += 4;
  } else if (insulationType === 'wood_fiber') {
    insulationGwpRate = 20;
    biogenicStoragePerM2 += 30;
    circularityScore += 3;
  }

  // Substructure & foundation factor (scales with height & weight)
  const foundationGwpRate = primaryStructure === 'glulam_mass_timber' ? 65 : 110;
  const totalEmbodiedPerM2 = Math.round(structuralGwpRate + insulationGwpRate + foundationGwpRate);
  const totalEmbodiedCarbonKg = Math.round(totalEmbodiedPerM2 * grossFloorAreaSqM);
  const totalBiogenicStorageKg = Math.round(biogenicStoragePerM2 * grossFloorAreaSqM);

  // Carbon benchmark rating
  let carbonRating: 'A' | 'B' | 'C' | 'D' = 'C';
  if (totalEmbodiedPerM2 < 180) carbonRating = 'A';
  else if (totalEmbodiedPerM2 < 280) carbonRating = 'B';
  else if (totalEmbodiedPerM2 < 420) carbonRating = 'C';
  else carbonRating = 'D';

  // --- Operational Energy & EUI Calculations (kWh/m2/yr) ---
  // Solar orientation factor: south-facing (near 180 azimuth) receives optimal winter gains
  const normalizedAzimuthDiff = Math.abs(180 - orientationAzimuth);
  const solarExposurePenalty = (normalizedAzimuthDiff / 180) * 12; // up to +12 kWh/m2 if sub-optimally rotated

  // Window-to-wall ratio thermal impact: higher WWR increases heating/cooling load
  let glazingUFactor = 1.6; // W/m2K
  let glazingShgc = 0.38;
  if (glazingType === 'triple_argon') {
    glazingUFactor = 0.8;
    glazingShgc = 0.28;
  } else if (glazingType === 'electrochromic') {
    glazingUFactor = 1.0;
    glazingShgc = 0.18; // dynamic solar tinting
  }

  const envelopeThermalLoss = windowToWallRatio * 42 * (glazingUFactor / 1.6);
  // Shading louver cooling offset: louvers reduce cooling peaks
  const louverOffset = Math.min(22, shadingLouverDepth * 18 * (1 - solarExposurePenalty / 30));

  // Baseline net zero EUI targets
  const baselineHeatingCooling = 55;
  const lightingPlugLoads = 32;
  const rawEui = baselineHeatingCooling + envelopeThermalLoss - louverOffset + solarExposurePenalty + lightingPlugLoads;
  const euiKwhPerSqMYear = Math.max(18, Number(rawEui.toFixed(1)));

  // Solar PV generation on roof
  const roofArea = footprintWidth * footprintDepth * areaModifier;
  const pvArea = roofArea * (photovoltaicCoverage / 100);
  const annualSolarGenKwh = Math.round(pvArea * 210); // ~210 kWh/m2 per year high-efficiency mono-Si
  const annualBuildingConsumptionKwh = euiKwhPerSqMYear * grossFloorAreaSqM;
  const netZeroReadinessPercent = Math.min(100, Math.round((annualSolarGenKwh / annualBuildingConsumptionKwh) * 100));

  // Grid emissions factor (0.28 kgCO2e/kWh regional mix)
  const annualEmissionsTonnes = Number(((annualBuildingConsumptionKwh - annualSolarGenKwh) * 0.00028).toFixed(1));

  // --- Daylight Autonomy (sDA 300/50%) ---
  // Floor plate depth penetration: daylight drops off past 8-10m from perimeter
  const depthPenalty = Math.max(0, (Math.min(footprintWidth, footprintDepth) - 20) * 1.5);
  const wwrBenefit = windowToWallRatio * 90;
  const louverDaylightCut = shadingLouverDepth * 12;
  const rawSda = Math.min(94, Math.max(30, 45 + wwrBenefit - depthPenalty - louverDaylightCut));
  const sda300_50 = Math.round(rawSda);
  const ase1000_250 = Math.round(Math.min(35, Math.max(4, windowToWallRatio * 32 - shadingLouverDepth * 16)));
  const glareRiskPercent = Math.round(Math.max(2, ase1000_250 * 0.9));
  const naturalLuxAverage = Math.round(380 + (sda300_50 / 100) * 450);

  // --- Structural Mechanics & Finite Element Proxy ---
  // Cantilever / wind shear deflection: delta ~ (q * H^4) / (8 * E * I)
  // Timber has lower stiffness (E_timber ~ 11 GPa vs E_steel ~ 200 GPa), requiring stiffened shear cores or outriggers
  const stiffnessFactor = primaryStructure === 'glulam_mass_timber' ? 1.0 : primaryStructure === 'hybrid_timber_steel' ? 1.8 : 2.2;
  const windLoadPressure = 1.25; // kPa base wind pressure
  const calculatedDeflectionMm = Number(((Math.pow(buildingHeightM, 3) * windLoadPressure * 0.00018) / stiffnessFactor).toFixed(1));
  const allowableDeflectionMm = Number((buildingHeightM * 1000 / 400).toFixed(1)); // H / 400 drift code limit
  const driftRatioVal = Math.round(buildingHeightM * 1000 / Math.max(0.1, calculatedDeflectionMm));
  const lateralDriftRatio = `H/${driftRatioVal}`;
  
  let structuralStatus: 'compliant' | 'warning' | 'excessive' = 'compliant';
  if (calculatedDeflectionMm > allowableDeflectionMm) {
    structuralStatus = 'excessive';
  } else if (calculatedDeflectionMm > allowableDeflectionMm * 0.75) {
    structuralStatus = 'warning';
  }

  const timberUtilizationRatio = Number(Math.min(1.2, 0.45 + (floors / 32) * 0.48).toFixed(2));
  const safetyFactor = Number(Math.max(1.1, 2.6 - (calculatedDeflectionMm / allowableDeflectionMm) * 0.9).toFixed(2));

  // --- Biophilic & Microclimate Index ---
  const greenCoverSqM = Math.round(roofArea * (greenRoofCoverage / 100) + (singleFloorArea * 0.12));
  const stormwaterRetentionPercent = Math.min(95, Math.round(30 + (greenRoofCoverage / 100) * 55));
  const microclimateCoolingC = Number(((greenRoofCoverage / 100) * 2.8 + (1 - windowToWallRatio) * 0.8).toFixed(1));
  const urbanBiodiversityScore = Math.min(100, Math.round(40 + (greenRoofCoverage / 100) * 45 + (typology === 'courtyard_metabolism' ? 15 : 0)));

  return {
    grossFloorAreaSqM,
    buildingHeightM,
    embodiedCarbon: {
      totalKgCo2e: totalEmbodiedCarbonKg,
      perSqMeter: totalEmbodiedPerM2,
      rating: carbonRating,
      biogenicCarbonStoredKg: totalBiogenicStorageKg,
      circularityIndex: Math.min(100, circularityScore),
    },
    operationalEnergy: {
      euiKwhPerSqMYear,
      annualEmissionsTonnes: Math.max(0, annualEmissionsTonnes),
      solarGenerationKwhYear: annualSolarGenKwh,
      netZeroReadinessPercent,
    },
    daylight: {
      sda300_50,
      ase1000_250,
      glareRiskPercent,
      naturalLuxAverage,
    },
    structural: {
      maxDeflectionMm: calculatedDeflectionMm,
      allowableDeflectionMm,
      lateralDriftRatio,
      safetyFactor,
      timberUtilizationRatio,
      status: structuralStatus,
    },
    biophilic: {
      greenCoverSqM,
      stormwaterRetentionPercent,
      microclimateCoolingC,
      urbanBiodiversityScore,
    },
    calculatedAt: new Date().toISOString(),
  };
}

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
