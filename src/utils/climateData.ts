import { BuildingTypology, GlazingType, InsulationType, PrimaryStructureType } from '../types';

export interface MonthlyClimatePoint {
  month: string;
  monthIndex: number;
  avgTempC: number;
  highTempC: number;
  lowTempC: number;
  solarGhiKwhM2Day: number; // Global Horizontal Irradiance (kWh/m²/day)
  solarDniKwhM2Day: number; // Direct Normal Irradiance
  windSpeedMs: number;
  windGustMs: number;
  prevailingWindDir: string;
  hdd: number; // Heating Degree Days (Base 18°C)
  cdd: number; // Cooling Degree Days (Base 18°C)
  humidityPercent: number;
  precipitationMm: number;
}

export interface ClimateStrategyRecommendation {
  recommendedTypology: BuildingTypology;
  recommendedTypologyName: string;
  recommendedOrientationAzimuth: number;
  recommendedWWR: number;
  recommendedLouverDepth: number;
  recommendedGlazing: GlazingType;
  recommendedInsulation: InsulationType;
  recommendedPrimaryStructure: PrimaryStructureType;
  recommendedGreenRoofCoverage: number;
  recommendedPvCoverage: number;
  headline: string;
  rationale: string;
  keyDesignDirectives: string[];
  climateHazards: string[];
}

export interface SiteClimateProfile {
  id: string;
  siteName: string;
  climateZoneCode: string;
  climateZoneName: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  annualMeanTempC: number;
  annualHdd: number;
  annualCdd: number;
  annualSolarKwhM2: number;
  prevailingWindSummary: string;
  monthlyData: MonthlyClimatePoint[];
  strategy: ClimateStrategyRecommendation;
}

export const SITE_CLIMATE_PROFILES: Record<string, SiteClimateProfile> = {
  boston: {
    id: 'boston',
    siteName: 'Boston Seaport Innovation District',
    climateZoneCode: 'Zone 5A',
    climateZoneName: 'Cold, Humid Maritime',
    latitude: 42.35,
    longitude: -71.04,
    elevationM: 6,
    annualMeanTempC: 10.8,
    annualHdd: 5580,
    annualCdd: 920,
    annualSolarKwhM2: 1420,
    prevailingWindSummary: 'NW winter blasts (up to 18 m/s gusts) · S/SW summer sea breeze',
    monthlyData: [
      { month: 'Jan', monthIndex: 0, avgTempC: -1.5, highTempC: 2.3, lowTempC: -5.4, solarGhiKwhM2Day: 2.1, solarDniKwhM2Day: 3.4, windSpeedMs: 5.6, windGustMs: 14.8, prevailingWindDir: 'NW', hdd: 605, cdd: 0, humidityPercent: 64, precipitationMm: 85 },
      { month: 'Feb', monthIndex: 1, avgTempC: -0.6, highTempC: 3.5, lowTempC: -4.6, solarGhiKwhM2Day: 3.0, solarDniKwhM2Day: 4.2, windSpeedMs: 5.4, windGustMs: 15.2, prevailingWindDir: 'NW', hdd: 520, cdd: 0, humidityPercent: 62, precipitationMm: 82 },
      { month: 'Mar', monthIndex: 2, avgTempC: 3.4, highTempC: 7.8, lowTempC: -1.0, solarGhiKwhM2Day: 4.1, solarDniKwhM2Day: 4.8, windSpeedMs: 5.2, windGustMs: 13.9, prevailingWindDir: 'NW', hdd: 452, cdd: 0, humidityPercent: 61, precipitationMm: 108 },
      { month: 'Apr', monthIndex: 3, avgTempC: 9.3, highTempC: 13.8, lowTempC: 4.8, solarGhiKwhM2Day: 5.2, solarDniKwhM2Day: 5.3, windSpeedMs: 4.9, windGustMs: 12.5, prevailingWindDir: 'E', hdd: 265, cdd: 4, humidityPercent: 63, precipitationMm: 95 },
      { month: 'May', monthIndex: 4, avgTempC: 15.1, highTempC: 19.9, lowTempC: 10.3, solarGhiKwhM2Day: 5.9, solarDniKwhM2Day: 5.6, windSpeedMs: 4.3, windGustMs: 11.2, prevailingWindDir: 'SW', hdd: 115, cdd: 25, humidityPercent: 68, precipitationMm: 88 },
      { month: 'Jun', monthIndex: 5, avgTempC: 20.6, highTempC: 25.5, lowTempC: 15.7, solarGhiKwhM2Day: 6.4, solarDniKwhM2Day: 6.0, windSpeedMs: 4.0, windGustMs: 10.4, prevailingWindDir: 'SW', hdd: 18, cdd: 96, humidityPercent: 71, precipitationMm: 92 },
      { month: 'Jul', monthIndex: 6, avgTempC: 23.9, highTempC: 28.6, lowTempC: 19.2, solarGhiKwhM2Day: 6.3, solarDniKwhM2Day: 5.9, windSpeedMs: 3.8, windGustMs: 9.8, prevailingWindDir: 'SW', hdd: 0, cdd: 183, humidityPercent: 70, precipitationMm: 86 },
      { month: 'Aug', monthIndex: 7, avgTempC: 23.1, highTempC: 27.7, lowTempC: 18.5, solarGhiKwhM2Day: 5.5, solarDniKwhM2Day: 5.4, windSpeedMs: 3.7, windGustMs: 9.6, prevailingWindDir: 'SW', hdd: 2, cdd: 160, humidityPercent: 72, precipitationMm: 85 },
      { month: 'Sep', monthIndex: 8, avgTempC: 18.9, highTempC: 23.4, lowTempC: 14.4, solarGhiKwhM2Day: 4.4, solarDniKwhM2Day: 4.9, windSpeedMs: 4.1, windGustMs: 10.8, prevailingWindDir: 'S', hdd: 45, cdd: 72, humidityPercent: 73, precipitationMm: 87 },
      { month: 'Oct', monthIndex: 9, avgTempC: 12.8, highTempC: 17.2, lowTempC: 8.4, solarGhiKwhM2Day: 3.2, solarDniKwhM2Day: 4.3, windSpeedMs: 4.6, windGustMs: 12.1, prevailingWindDir: 'W', hdd: 185, cdd: 8, humidityPercent: 71, precipitationMm: 100 },
      { month: 'Nov', monthIndex: 10, avgTempC: 7.1, highTempC: 11.2, lowTempC: 3.0, solarGhiKwhM2Day: 2.2, solarDniKwhM2Day: 3.6, windSpeedMs: 5.0, windGustMs: 13.5, prevailingWindDir: 'NW', hdd: 330, cdd: 0, humidityPercent: 68, precipitationMm: 101 },
      { month: 'Dec', monthIndex: 11, avgTempC: 1.6, highTempC: 5.6, lowTempC: -2.3, solarGhiKwhM2Day: 1.7, solarDniKwhM2Day: 3.1, windSpeedMs: 5.4, windGustMs: 14.4, prevailingWindDir: 'NW', hdd: 508, cdd: 0, humidityPercent: 66, precipitationMm: 98 },
    ],
    strategy: {
      recommendedTypology: 'stepped_terrace',
      recommendedTypologyName: 'Stepped Biophilic Terraces',
      recommendedOrientationAzimuth: 170, // Slight southeast bias for morning solar gain
      recommendedWWR: 0.42,
      recommendedLouverDepth: 0.6,
      recommendedGlazing: 'triple_argon',
      recommendedInsulation: 'mycelium_bio_composite',
      recommendedPrimaryStructure: 'glulam_mass_timber',
      recommendedGreenRoofCoverage: 75,
      recommendedPvCoverage: 65,
      headline: 'Aerodynamic Coastal Massing with High Thermal Envelope Integrity',
      rationale:
        'The Boston Seaport faces severe winter nor\'easters and persistent coastal wind shear. Stepped biophilic terraces deflect turbulent downdrafts away from pedestrian plazas, while deep south-facing louvers prevent mid-summer overheating during high solar angles.',
      keyDesignDirectives: [
        'Orient primary axis 10° East of South to maximize passive morning solar warming in winter.',
        'Adopt stepped setbacks on North and East facades to buffer Atlantic wind shear.',
        'Incorporate triple-glazed argon thermal breaks to mitigate the 5,580 annual Heating Degree Days.',
        'Deploy green roof sedum terraces to retard peak coastal stormwater surge.',
      ],
      climateHazards: [
        'High winter windward pressure (+1.25 kPa) causing air infiltration',
        'Sea-level rise & extreme precipitation storm surges',
        'Humid summer heat islands requiring natural ventilation bypass',
      ],
    },
  },

  flint: {
    id: 'flint',
    siteName: 'Flint Riverfront Regenerative Hub',
    climateZoneCode: 'Zone 5A',
    climateZoneName: 'Severe Continental Cold',
    latitude: 43.01,
    longitude: -83.69,
    elevationM: 228,
    annualMeanTempC: 8.9,
    annualHdd: 6750,
    annualCdd: 760,
    annualSolarKwhM2: 1380,
    prevailingWindSummary: 'W/NW freezing continental winds (winter) · SW thermal convection (summer)',
    monthlyData: [
      { month: 'Jan', monthIndex: 0, avgTempC: -5.1, highTempC: -1.2, lowTempC: -9.0, solarGhiKwhM2Day: 1.8, solarDniKwhM2Day: 2.8, windSpeedMs: 4.8, windGustMs: 13.2, prevailingWindDir: 'W', hdd: 715, cdd: 0, humidityPercent: 78, precipitationMm: 50 },
      { month: 'Feb', monthIndex: 1, avgTempC: -4.2, highTempC: -0.1, lowTempC: -8.3, solarGhiKwhM2Day: 2.7, solarDniKwhM2Day: 3.7, windSpeedMs: 4.6, windGustMs: 12.8, prevailingWindDir: 'W', hdd: 620, cdd: 0, humidityPercent: 75, precipitationMm: 48 },
      { month: 'Mar', monthIndex: 2, avgTempC: 1.2, highTempC: 6.2, lowTempC: -3.8, solarGhiKwhM2Day: 3.8, solarDniKwhM2Day: 4.4, windSpeedMs: 4.5, windGustMs: 12.5, prevailingWindDir: 'SW', hdd: 520, cdd: 0, humidityPercent: 70, precipitationMm: 62 },
      { month: 'Apr', monthIndex: 3, avgTempC: 8.1, highTempC: 13.9, lowTempC: 2.3, solarGhiKwhM2Day: 4.9, solarDniKwhM2Day: 5.1, windSpeedMs: 4.4, windGustMs: 12.0, prevailingWindDir: 'SW', hdd: 300, cdd: 3, humidityPercent: 65, precipitationMm: 80 },
      { month: 'May', monthIndex: 4, avgTempC: 14.3, highTempC: 20.6, lowTempC: 8.0, solarGhiKwhM2Day: 5.7, solarDniKwhM2Day: 5.5, windSpeedMs: 3.8, windGustMs: 10.6, prevailingWindDir: 'SW', hdd: 140, cdd: 25, humidityPercent: 66, precipitationMm: 88 },
      { month: 'Jun', monthIndex: 5, avgTempC: 19.8, highTempC: 26.0, lowTempC: 13.6, solarGhiKwhM2Day: 6.3, solarDniKwhM2Day: 6.1, windSpeedMs: 3.4, windGustMs: 9.8, prevailingWindDir: 'SW', hdd: 25, cdd: 79, humidityPercent: 69, precipitationMm: 85 },
      { month: 'Jul', monthIndex: 6, avgTempC: 22.3, highTempC: 28.4, lowTempC: 16.2, solarGhiKwhM2Day: 6.2, solarDniKwhM2Day: 5.8, windSpeedMs: 3.1, windGustMs: 8.9, prevailingWindDir: 'SW', hdd: 0, cdd: 133, humidityPercent: 70, precipitationMm: 89 },
      { month: 'Aug', monthIndex: 7, avgTempC: 21.2, highTempC: 27.2, lowTempC: 15.2, solarGhiKwhM2Day: 5.4, solarDniKwhM2Day: 5.3, windSpeedMs: 2.9, windGustMs: 8.5, prevailingWindDir: 'SW', hdd: 5, cdd: 104, humidityPercent: 74, precipitationMm: 84 },
      { month: 'Sep', monthIndex: 8, avgTempC: 16.8, highTempC: 22.8, lowTempC: 10.8, solarGhiKwhM2Day: 4.2, solarDniKwhM2Day: 4.7, windSpeedMs: 3.2, windGustMs: 9.4, prevailingWindDir: 'S', hdd: 78, cdd: 42, humidityPercent: 75, precipitationMm: 82 },
      { month: 'Oct', monthIndex: 9, avgTempC: 10.2, highTempC: 15.8, lowTempC: 4.6, solarGhiKwhM2Day: 2.9, solarDniKwhM2Day: 3.9, windSpeedMs: 3.8, windGustMs: 11.0, prevailingWindDir: 'SW', hdd: 245, cdd: 3, humidityPercent: 74, precipitationMm: 72 },
      { month: 'Nov', monthIndex: 10, avgTempC: 4.1, highTempC: 8.6, lowTempC: -0.4, solarGhiKwhM2Day: 1.8, solarDniKwhM2Day: 2.9, windSpeedMs: 4.3, windGustMs: 12.4, prevailingWindDir: 'W', hdd: 420, cdd: 0, humidityPercent: 77, precipitationMm: 68 },
      { month: 'Dec', monthIndex: 11, avgTempC: -1.9, highTempC: 2.1, lowTempC: -5.9, solarGhiKwhM2Day: 1.4, solarDniKwhM2Day: 2.3, windSpeedMs: 4.7, windGustMs: 13.0, prevailingWindDir: 'W', hdd: 615, cdd: 0, humidityPercent: 80, precipitationMm: 56 },
    ],
    strategy: {
      recommendedTypology: 'courtyard_metabolism',
      recommendedTypologyName: 'Courtyard Metabolism',
      recommendedOrientationAzimuth: 180, // True South for maximum solar heat gain
      recommendedWWR: 0.38,
      recommendedLouverDepth: 0.4,
      recommendedGlazing: 'triple_argon',
      recommendedInsulation: 'wood_fiber',
      recommendedPrimaryStructure: 'glulam_mass_timber',
      recommendedGreenRoofCoverage: 60,
      recommendedPvCoverage: 70,
      headline: 'Enclosed Microclimate Courtyard with Compact Surface-to-Volume Ratio',
      rationale:
        'Flint features extreme continental winter temperatures with 6,750 heating degree days. An inward-facing Courtyard Metabolism creates a sheltered, bio-tempered microclimate pocket protected from prevailing western sub-zero winds while centralizing passive solar heat gains.',
      keyDesignDirectives: [
        'Organize building mass around an internal atrium/courtyard to trap solar heat and block cold northern winds.',
        'Restrain Window-to-Wall ratio to 38% to minimize envelope thermal bridging.',
        'Specify thick wood fiber insulation (R-38+) on exterior perimeter assemblies.',
        'Position south-facing thermal mass floors in the courtyard to absorb and radiate winter sunlight.',
      ],
      climateHazards: [
        'Sub-zero winter freezes (-9°C) and frost heave',
        'Prolonged overcast winter cloud cover reducing passive solar yield',
        'Localized riverfront humidity swings and freezing fog',
      ],
    },
  },

  seattle: {
    id: 'seattle',
    siteName: 'Seattle Waterfront Mixed-Use',
    climateZoneCode: 'Zone 4C',
    climateZoneName: 'Marine Mild Maritime',
    latitude: 47.60,
    longitude: -122.34,
    elevationM: 14,
    annualMeanTempC: 11.5,
    annualHdd: 4620,
    annualCdd: 310,
    annualSolarKwhM2: 1250,
    prevailingWindSummary: 'SSW maritime moisture-laden winds · Mild summer NW breezes',
    monthlyData: [
      { month: 'Jan', monthIndex: 0, avgTempC: 5.6, highTempC: 8.8, lowTempC: 2.4, solarGhiKwhM2Day: 1.4, solarDniKwhM2Day: 2.1, windSpeedMs: 4.2, windGustMs: 11.4, prevailingWindDir: 'S', hdd: 385, cdd: 0, humidityPercent: 79, precipitationMm: 142 },
      { month: 'Feb', monthIndex: 1, avgTempC: 6.4, highTempC: 10.2, lowTempC: 2.6, solarGhiKwhM2Day: 2.3, solarDniKwhM2Day: 3.1, windSpeedMs: 4.0, windGustMs: 11.0, prevailingWindDir: 'S', hdd: 325, cdd: 0, humidityPercent: 75, precipitationMm: 89 },
      { month: 'Mar', monthIndex: 2, avgTempC: 8.4, highTempC: 12.6, lowTempC: 4.2, solarGhiKwhM2Day: 3.4, solarDniKwhM2Day: 3.9, windSpeedMs: 4.1, windGustMs: 10.8, prevailingWindDir: 'SSW', hdd: 298, cdd: 0, humidityPercent: 72, precipitationMm: 95 },
      { month: 'Apr', monthIndex: 3, avgTempC: 10.9, highTempC: 15.3, lowTempC: 6.5, solarGhiKwhM2Day: 4.6, solarDniKwhM2Day: 4.5, windSpeedMs: 3.9, windGustMs: 10.2, prevailingWindDir: 'SSW', hdd: 215, cdd: 0, humidityPercent: 68, precipitationMm: 68 },
      { month: 'May', monthIndex: 4, avgTempC: 14.2, highTempC: 18.9, lowTempC: 9.5, solarGhiKwhM2Day: 5.6, solarDniKwhM2Day: 5.2, windSpeedMs: 3.6, windGustMs: 9.2, prevailingWindDir: 'SW', hdd: 122, cdd: 5, humidityPercent: 66, precipitationMm: 50 },
      { month: 'Jun', monthIndex: 5, avgTempC: 17.1, highTempC: 21.8, lowTempC: 12.4, solarGhiKwhM2Day: 6.1, solarDniKwhM2Day: 5.8, windSpeedMs: 3.5, windGustMs: 8.8, prevailingWindDir: 'NW', hdd: 48, cdd: 21, humidityPercent: 64, precipitationMm: 40 },
      { month: 'Jul', monthIndex: 6, avgTempC: 19.8, highTempC: 25.1, lowTempC: 14.5, solarGhiKwhM2Day: 6.4, solarDniKwhM2Day: 6.3, windSpeedMs: 3.3, windGustMs: 8.2, prevailingWindDir: 'NW', hdd: 12, cdd: 68, humidityPercent: 62, precipitationMm: 18 },
      { month: 'Aug', monthIndex: 7, avgTempC: 20.1, highTempC: 25.4, lowTempC: 14.8, solarGhiKwhM2Day: 5.4, solarDniKwhM2Day: 5.6, windSpeedMs: 3.2, windGustMs: 8.0, prevailingWindDir: 'NW', hdd: 10, cdd: 75, humidityPercent: 63, precipitationMm: 24 },
      { month: 'Sep', monthIndex: 8, avgTempC: 16.9, highTempC: 22.0, lowTempC: 11.8, solarGhiKwhM2Day: 4.1, solarDniKwhM2Day: 4.6, windSpeedMs: 3.4, windGustMs: 8.9, prevailingWindDir: 'S', hdd: 60, cdd: 27, humidityPercent: 69, precipitationMm: 38 },
      { month: 'Oct', monthIndex: 9, avgTempC: 12.1, highTempC: 15.9, lowTempC: 8.3, solarGhiKwhM2Day: 2.5, solarDniKwhM2Day: 3.2, windSpeedMs: 3.7, windGustMs: 9.8, prevailingWindDir: 'S', hdd: 185, cdd: 0, humidityPercent: 77, precipitationMm: 88 },
      { month: 'Nov', monthIndex: 10, avgTempC: 8.1, highTempC: 11.3, lowTempC: 4.9, solarGhiKwhM2Day: 1.5, solarDniKwhM2Day: 2.2, windSpeedMs: 4.1, windGustMs: 11.5, prevailingWindDir: 'S', hdd: 298, cdd: 0, humidityPercent: 81, precipitationMm: 165 },
      { month: 'Dec', monthIndex: 11, avgTempC: 5.4, highTempC: 8.4, lowTempC: 2.4, solarGhiKwhM2Day: 1.1, solarDniKwhM2Day: 1.7, windSpeedMs: 4.3, windGustMs: 12.0, prevailingWindDir: 'S', hdd: 391, cdd: 0, humidityPercent: 82, precipitationMm: 155 },
    ],
    strategy: {
      recommendedTypology: 'mass_timber_tower',
      recommendedTypologyName: 'Slender Mass Timber Tower',
      recommendedOrientationAzimuth: 185,
      recommendedWWR: 0.52, // Higher WWR for cloudy climate daylight penetration
      recommendedLouverDepth: 0.35,
      recommendedGlazing: 'double_low_e',
      recommendedInsulation: 'dense_pack_cellulose',
      recommendedPrimaryStructure: 'glulam_mass_timber',
      recommendedGreenRoofCoverage: 85, // Maximize stormwater retention
      recommendedPvCoverage: 55,
      headline: 'Deep Daylight Autonomy with Extensive Biophilic Stormwater Retention',
      rationale:
        'With temperate maritime winters and over 220 cloudy days per year, Seattle requires slender building depths (bay spacing 6.0m–7.2m) and increased window-to-wall ratios (52%) to achieve 70%+ Spatial Daylight Autonomy without relying on artificial electric lighting.',
      keyDesignDirectives: [
        'Utilize slender floor plate depths (under 28m) to facilitate cross-ventilation and bilateral natural light.',
        'Increase south and east glazing with low-e spectrally selective coating to harvest diffuse sky radiation.',
        'Integrate intensive living roof sedum beds to capture 85% of Puget Sound wet season rainfall runoff.',
        'Expose glulam mass timber beams to promote biophilic indoor wellness during dark winter months.',
      ],
      climateHazards: [
        'Persistent high humidity and prolonged winter cloud cover',
        'Extreme rainfall runoff taxing urban stormwater infrastructure',
        'Moderate seismic subduction zone requiring ductile timber moment frames',
      ],
    },
  },

  denver: {
    id: 'denver',
    siteName: 'Denver RiNo Biophilic District',
    climateZoneCode: 'Zone 5B',
    climateZoneName: 'High Altitude Semi-Arid',
    latitude: 39.76,
    longitude: -104.98,
    elevationM: 1609,
    annualMeanTempC: 10.4,
    annualHdd: 5920,
    annualCdd: 850,
    annualSolarKwhM2: 1780,
    prevailingWindSummary: 'S/SW dry winds · Periodic high mountain Chinook winds (>20 m/s)',
    monthlyData: [
      { month: 'Jan', monthIndex: 0, avgTempC: -0.6, highTempC: 6.8, lowTempC: -8.0, solarGhiKwhM2Day: 2.8, solarDniKwhM2Day: 5.2, windSpeedMs: 4.1, windGustMs: 14.5, prevailingWindDir: 'S', hdd: 578, cdd: 0, humidityPercent: 52, precipitationMm: 12 },
      { month: 'Feb', monthIndex: 1, avgTempC: 0.8, highTempC: 8.2, lowTempC: -6.6, solarGhiKwhM2Day: 3.7, solarDniKwhM2Day: 5.8, windSpeedMs: 4.3, windGustMs: 15.2, prevailingWindDir: 'S', hdd: 485, cdd: 0, humidityPercent: 51, precipitationMm: 15 },
      { month: 'Mar', monthIndex: 2, avgTempC: 5.6, highTempC: 13.5, lowTempC: -2.3, solarGhiKwhM2Day: 4.8, solarDniKwhM2Day: 6.2, windSpeedMs: 4.7, windGustMs: 16.0, prevailingWindDir: 'S', hdd: 385, cdd: 0, humidityPercent: 50, precipitationMm: 28 },
      { month: 'Apr', monthIndex: 3, avgTempC: 10.1, highTempC: 18.2, lowTempC: 2.0, solarGhiKwhM2Day: 5.8, solarDniKwhM2Day: 6.6, windSpeedMs: 4.9, windGustMs: 16.5, prevailingWindDir: 'S', hdd: 240, cdd: 3, humidityPercent: 48, precipitationMm: 45 },
      { month: 'May', monthIndex: 4, avgTempC: 15.3, highTempC: 23.4, lowTempC: 7.2, solarGhiKwhM2Day: 6.6, solarDniKwhM2Day: 6.9, windSpeedMs: 4.4, windGustMs: 14.0, prevailingWindDir: 'S', hdd: 110, cdd: 28, humidityPercent: 50, precipitationMm: 62 },
      { month: 'Jun', monthIndex: 5, avgTempC: 21.2, highTempC: 30.1, lowTempC: 12.3, solarGhiKwhM2Day: 7.4, solarDniKwhM2Day: 7.5, windSpeedMs: 4.0, windGustMs: 13.2, prevailingWindDir: 'SW', hdd: 12, cdd: 108, humidityPercent: 44, precipitationMm: 48 },
      { month: 'Jul', monthIndex: 6, avgTempC: 24.8, highTempC: 33.2, lowTempC: 16.4, solarGhiKwhM2Day: 7.2, solarDniKwhM2Day: 7.3, windSpeedMs: 3.8, windGustMs: 12.5, prevailingWindDir: 'SW', hdd: 0, cdd: 210, humidityPercent: 43, precipitationMm: 52 },
      { month: 'Aug', monthIndex: 7, avgTempC: 23.6, highTempC: 31.8, lowTempC: 15.4, solarGhiKwhM2Day: 6.5, solarDniKwhM2Day: 6.8, windSpeedMs: 3.6, windGustMs: 11.8, prevailingWindDir: 'S', hdd: 2, cdd: 175, humidityPercent: 46, precipitationMm: 42 },
      { month: 'Sep', monthIndex: 8, avgTempC: 18.4, highTempC: 26.6, lowTempC: 10.2, solarGhiKwhM2Day: 5.4, solarDniKwhM2Day: 6.4, windSpeedMs: 3.8, windGustMs: 12.4, prevailingWindDir: 'S', hdd: 52, cdd: 64, humidityPercent: 47, precipitationMm: 30 },
      { month: 'Oct', monthIndex: 9, avgTempC: 11.8, highTempC: 19.4, lowTempC: 4.2, solarGhiKwhM2Day: 4.1, solarDniKwhM2Day: 5.7, windSpeedMs: 4.0, windGustMs: 13.5, prevailingWindDir: 'S', hdd: 202, cdd: 4, humidityPercent: 48, precipitationMm: 25 },
      { month: 'Nov', monthIndex: 10, avgTempC: 4.8, highTempC: 12.1, lowTempC: -2.5, solarGhiKwhM2Day: 2.9, solarDniKwhM2Day: 5.1, windSpeedMs: 4.2, windGustMs: 14.8, prevailingWindDir: 'S', hdd: 395, cdd: 0, humidityPercent: 51, precipitationMm: 18 },
      { month: 'Dec', monthIndex: 11, avgTempC: -0.4, highTempC: 6.9, lowTempC: -7.7, solarGhiKwhM2Day: 2.5, solarDniKwhM2Day: 4.9, windSpeedMs: 4.1, windGustMs: 14.6, prevailingWindDir: 'S', hdd: 571, cdd: 0, humidityPercent: 53, precipitationMm: 14 },
    ],
    strategy: {
      recommendedTypology: 'biophilic_podium',
      recommendedTypologyName: 'Biophilic Solar Podium',
      recommendedOrientationAzimuth: 175,
      recommendedWWR: 0.44,
      recommendedLouverDepth: 0.9, // Deep louvers for high altitude solar radiation
      recommendedGlazing: 'electrochromic',
      recommendedInsulation: 'wood_fiber',
      recommendedPrimaryStructure: 'hybrid_timber_steel',
      recommendedGreenRoofCoverage: 50,
      recommendedPvCoverage: 85, // Extraordinary solar insolation (>1,780 kWh/m²)
      headline: 'Heavy Thermal Mass with Deep Solar Shading and Peak PV Generation',
      rationale:
        'Denver experiences intense high-altitude UV radiation (>300 days of sunshine) paired with huge diurnal swings of up to 17°C between day and night. Deep exterior louvers (0.9m) and electrochromic glazing block scorching summer solar peaks while massive rooftop PV arrays generate surplus clean energy.',
      keyDesignDirectives: [
        'Install deep 0.9m horizontal cantilever louvers to shade steep summer sun while admitting low winter sun.',
        'Utilize exposed cross-laminated timber soffits to act as a thermal battery dampening diurnal swings.',
        'Maximize roof PV coverage to 85% to tap into Denver\'s exceptional 1,780 kWh/m² annual solar irradiance.',
        'Engineer structural connections for high-velocity Chinook wind gusts exceeding 16 m/s.',
      ],
      climateHazards: [
        'Extreme diurnal temperature swings (up to 17°C in 24 hours)',
        'Severe summer solar overheating and intense high-elevation UV index',
        'Sudden intense mountain downdraft gusts and winter blizzards',
      ],
    },
  },
};

export function getClimateProfileForLocation(locationString: string): SiteClimateProfile {
  const lower = locationString.toLowerCase();
  if (lower.includes('flint')) return SITE_CLIMATE_PROFILES.flint;
  if (lower.includes('seattle')) return SITE_CLIMATE_PROFILES.seattle;
  if (lower.includes('denver')) return SITE_CLIMATE_PROFILES.denver;
  return SITE_CLIMATE_PROFILES.boston; // Default
}
