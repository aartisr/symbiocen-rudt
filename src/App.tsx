import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from '@tanstack/react-query';
import {
  BuildingParameters,
  SimulationMetrics,
  AgentDebateTurn,
  ShaderMode,
  MaterialInventoryItem,
  ParameterTweak,
} from './types';
import {
  calculateBuildingSimulation,
  generateMaterialInventory,
} from './utils/physicsEngine';
import { TopBar } from './components/navigation/TopBar';
import { ThreeDigitalTwin } from './components/viewport/ThreeDigitalTwin';
import { CarbonInventoryTable } from './components/inventory/CarbonInventoryTable';
import { AgentCouncilPanel } from './components/agents/AgentCouncilPanel';
import { SystemsCoDesignGraph } from './components/agents/SystemsCoDesignGraph';
import { PortfolioBriefModal } from './components/export/PortfolioBriefModal';
import { SiteClimateChart } from './components/charts/SiteClimateChart';
import { ClimateStrategyRecommendation } from './utils/climateData';
import {
  Building2,
  TreePine,
  Sliders,
  Cpu,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  Compass,
  MapPin,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const defaultParameters: BuildingParameters = {
  typology: 'mass_timber_tower',
  floors: 12,
  floorHeight: 3.8,
  footprintWidth: 32,
  footprintDepth: 28,
  baySpacing: 6.0,
  windowToWallRatio: 0.45,
  shadingLouverDepth: 0.5,
  glazingType: 'triple_argon',
  primaryStructure: 'glulam_mass_timber',
  insulationType: 'mycelium_bio_composite',
  greenRoofCoverage: 70,
  photovoltaicCoverage: 65,
  siteLocation: 'Boston Seaport Innovation District (Zone 5A)',
  orientationAzimuth: 180,
  explodedViewProgress: 0.0,
};

function SymbiocenApp() {
  const [parameters, setParameters] = useState<BuildingParameters>(defaultParameters);
  const [shaderMode, setShaderMode] = useState<ShaderMode>('pbr');
  const [activeRightTab, setActiveRightTab] = useState<'agents' | 'inventory' | 'graph' | 'site'>('agents');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeliberating, setIsDeliberating] = useState(false);

  // Compute live physics simulation metrics and materials using TanStack Query
  const { data: simData } = useQuery({
    queryKey: ['simulation', parameters],
    queryFn: async () => {
      // Local immediate computation with fallback backend verification
      const metrics = calculateBuildingSimulation(parameters);
      const materials = generateMaterialInventory(parameters);
      return { metrics, materials };
    },
    initialData: () => ({
      metrics: calculateBuildingSimulation(defaultParameters),
      materials: generateMaterialInventory(defaultParameters),
    }),
  });

  const { metrics, materials } = simData;

  // Initial council debate turns
  const [debateTurns, setDebateTurns] = useState<AgentDebateTurn[]>([
    {
      id: 'init-arch',
      agentId: 'architect',
      roleName: 'Elena Rostova, AIA',
      roleTitle: 'Lead Design Architect',
      avatarIcon: 'Compass',
      status: 'approved',
      headline: 'Biophilic Massing & Solar Glazing',
      commentary:
        'The south-facing orientation and 45% glazing ratio provide generous natural illumination across perimeter study labs while terracotta louvers mitigate unwanted summer solar thermal gain.',
      keyMetric: '72% sDA Daylight',
      suggestedTweaks: [
        {
          parameter: 'shadingLouverDepth',
          currentVal: '0.5m',
          suggestedVal: '0.7m',
          rationale: 'Extending louvers by 0.2m protects southern exposures during mid-day solar peak.',
          impactMetric: '+6% Glare Comfort',
        },
      ],
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'init-eng',
      agentId: 'engineer',
      roleName: 'Marcus Vance, PE, SE',
      roleTitle: 'Senior Structural & MEP Engineer',
      avatarIcon: 'Activity',
      status: 'approved',
      headline: 'Structural Timber Lateral Rigidity',
      commentary:
        'Glulam post-and-beam columns combined with 5-ply CLT diaphragms easily satisfy gravity loads. Lateral wind drift deflection is verified well within the H/400 structural standard.',
      keyMetric: 'Drift H/480 (Safe)',
      suggestedTweaks: [
        {
          parameter: 'baySpacing',
          currentVal: '6.0m',
          suggestedVal: '7.2m',
          rationale: 'Increasing bay spacing to 7.2m standardizes timber spans and reduces total column count by 16%.',
          impactMetric: '-8% Timber Volume',
        },
      ],
      timestamp: Date.now() - 3500000,
    },
    {
      id: 'init-con',
      agentId: 'constructor',
      roleName: 'David Chen, CCM',
      roleTitle: 'Virtual Construction Manager',
      avatarIcon: 'Layers',
      status: 'approved',
      headline: 'Modular Prefabrication Speed',
      commentary:
        'Factory CNC prefabrication of timber connections enables quiet, crane-assisted dry erection on site, eliminating concrete curing delays and reducing urban neighborhood noise.',
      keyMetric: '30% Faster Erection',
      suggestedTweaks: [],
      timestamp: Date.now() - 3400000,
    },
    {
      id: 'init-eco',
      agentId: 'ecologist',
      roleName: 'Dr. Soraya Morales',
      roleTitle: 'Regenerative Systems Ecologist',
      avatarIcon: 'Leaf',
      status: 'approved',
      headline: 'Net Negative Biogenic Carbon Sink',
      commentary:
        'Specifying sustainably harvested mass timber and mycelium insulation sequesters hundreds of metric tonnes of atmospheric CO₂ inside the structural fabric, qualifying for Grade A carbon ranking.',
      keyMetric: '92 kgCO₂e/m²',
      suggestedTweaks: [
        {
          parameter: 'greenRoofCoverage',
          currentVal: '70%',
          suggestedVal: '85%',
          rationale: 'Expanding sedum cover maximizes stormwater retention and provides urban pollinator stepping stones.',
          impactMetric: '+15% Stormwater Retention',
        },
      ],
      timestamp: Date.now() - 3300000,
    },
  ]);

  // Parameter update helper
  const handleParameterChange = useCallback((key: keyof BuildingParameters, value: any) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Adopt parameter tweak suggested by an agent
  const handleApplyTweak = useCallback((tweak: ParameterTweak) => {
    const { parameter, suggestedVal } = tweak;
    let parsedVal: any = suggestedVal;
    if (typeof suggestedVal === 'string') {
      if (suggestedVal.endsWith('m')) parsedVal = parseFloat(suggestedVal);
      else if (suggestedVal.endsWith('%')) parsedVal = parseInt(suggestedVal, 10);
    }
    setParameters((prev) => ({
      ...prev,
      [parameter]: parsedVal,
    }));
  }, []);

  // Apply low-carbon material alternative from the TanStack Table
  const handleApplyMaterialAlternative = useCallback((item: MaterialInventoryItem) => {
    if (item.category === 'Substructure') {
      setParameters((prev) => ({ ...prev, primaryStructure: 'glulam_mass_timber' }));
    } else if (item.category === 'Superstructure') {
      setParameters((prev) => ({ ...prev, primaryStructure: 'glulam_mass_timber' }));
    } else if (item.category === 'Envelope') {
      setParameters((prev) => ({ ...prev, insulationType: 'mycelium_bio_composite' }));
    }
  }, []);

  // Trigger Multi-Agent Deliberation Council via backend SSE
  const handleTriggerDeliberation = async () => {
    setIsDeliberating(true);
    try {
      const response = await fetch('/api/agents/deliberate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters,
          metrics,
        }),
      });

      if (!response.body) {
        setIsDeliberating(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: agent_turn')) {
            const dataMatch = line.match(/data: (.*)/);
            if (dataMatch) {
              const turn: AgentDebateTurn = JSON.parse(dataMatch[1]);
              setDebateTurns((prev) => {
                const existingIdx = prev.findIndex((t) => t.agentId === turn.agentId);
                if (existingIdx >= 0) {
                  const updated = [...prev];
                  updated[existingIdx] = turn;
                  return updated;
                }
                return [turn, ...prev];
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Deliberation streaming failed:', err);
    } finally {
      setIsDeliberating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070A10] text-slate-100 font-['Public_Sans',sans-serif]">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <TopBar
        activeTab={activeRightTab === 'agents' ? 'agents' : activeRightTab === 'inventory' ? 'inventory' : activeRightTab === 'graph' ? 'graph' : 'twin'}
        onSelectTab={(tab) => {
          if (tab === 'twin') setActiveRightTab('agents');
          else setActiveRightTab(tab);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: 3D Digital Twin Viewport (52% on desktop) */}
        <div className="w-full lg:w-[52%] h-1/2 lg:h-full relative border-r border-slate-800/80 shrink-0">
          <ThreeDigitalTwin
            parameters={parameters}
            metrics={metrics}
            onParameterChange={handleParameterChange}
            shaderMode={shaderMode}
            onShaderModeChange={setShaderMode}
          />
        </div>

        {/* Right Pane: Multi-Agent Council & Metabolic Engineering Tools (48%) */}
        <div className="w-full lg:w-[48%] h-1/2 lg:h-full flex flex-col bg-[#0A0E17] overflow-hidden">
          {/* Right Pane Segmented Tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D121F] border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1 p-0.5 bg-[#070A10] rounded-lg border border-slate-800/80">
              <button
                onClick={() => setActiveRightTab('agents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeRightTab === 'agents'
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Agent Council</span>
              </button>

              <button
                onClick={() => setActiveRightTab('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeRightTab === 'inventory'
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>EC3 Carbon Table</span>
              </button>

              <button
                onClick={() => setActiveRightTab('graph')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeRightTab === 'graph'
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Systems Graph</span>
              </button>

              <button
                onClick={() => setActiveRightTab('site')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  activeRightTab === 'site'
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Site Studio</span>
              </button>
            </div>

            {/* Quick GFA & EUI Badge */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{metrics.operationalEnergy.euiKwhPerSqMYear} EUI</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">{metrics.embodiedCarbon.perSqMeter} kgCO₂e</span>
            </div>
          </div>

          {/* Active Tab Viewport Area */}
          <div className="flex-1 overflow-hidden p-3.5">
            {activeRightTab === 'agents' && (
              <AgentCouncilPanel
                debateTurns={debateTurns}
                isDeliberating={isDeliberating}
                onTriggerDeliberation={handleTriggerDeliberation}
                onApplyTweak={handleApplyTweak}
                parameters={parameters}
                metrics={metrics}
              />
            )}

            {activeRightTab === 'inventory' && (
              <CarbonInventoryTable
                items={materials}
                metrics={metrics}
                onApplyAlternative={handleApplyMaterialAlternative}
              />
            )}

            {activeRightTab === 'graph' && (
              <SystemsCoDesignGraph
                parameters={parameters}
                metrics={metrics}
              />
            )}

            {activeRightTab === 'site' && (
              /* Site & Typology Studio Tab */
              <div className="h-full bg-[#0E1524] rounded-xl border border-slate-800 p-5 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Project Context & Typology Studio</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure regional climate zone, massing archetype, and primary low-carbon structural framework
                  </p>
                </div>

                {/* Urban Site Parcel Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Site Location & Climate Standard
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        name: 'Boston Seaport Innovation District',
                        zone: 'Climate Zone 5A · BERDO 2.0 & MA Stretch Code',
                        wind: '1.25 kPa prevailing sea winds',
                      },
                      {
                        name: 'Flint Riverfront Regenerative Hub',
                        zone: 'Climate Zone 5A · Michigan Energy Efficiency Code',
                        wind: '0.95 kPa continental winds',
                      },
                      {
                        name: 'Seattle Waterfront Mixed-Use',
                        zone: 'Climate Zone 4C · Washington Clean Buildings Act',
                        wind: '1.10 kPa coastal maritime',
                      },
                      {
                        name: 'Denver RiNo Biophilic District',
                        zone: 'Climate Zone 5B · High Altitude Solar Envelope',
                        wind: '1.30 kPa mountain downdrafts',
                      },
                    ].map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => handleParameterChange('siteLocation', loc.name)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          parameters.siteLocation === loc.name
                            ? 'bg-amber-950/40 border border-amber-500/60 shadow-sm'
                            : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">{loc.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{loc.zone}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{loc.wind}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-Time D3.js Historical Weather & Climate Pattern Chart */}
                <SiteClimateChart
                  siteLocation={parameters.siteLocation}
                  onApplyStrategy={(strat: ClimateStrategyRecommendation) => {
                    setParameters((prev) => ({
                      ...prev,
                      typology: strat.recommendedTypology,
                      orientationAzimuth: strat.recommendedOrientationAzimuth,
                      windowToWallRatio: strat.recommendedWWR,
                      shadingLouverDepth: strat.recommendedLouverDepth,
                      glazingType: strat.recommendedGlazing,
                      insulationType: strat.recommendedInsulation,
                      primaryStructure: strat.recommendedPrimaryStructure,
                      greenRoofCoverage: strat.recommendedGreenRoofCoverage,
                      photovoltaicCoverage: strat.recommendedPvCoverage,
                    }));
                  }}
                />

                {/* Building Typology */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" /> Massing Archetype
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'mass_timber_tower', label: 'Mass Timber Tower', desc: 'Compact vertical core with timber column grid' },
                      { id: 'stepped_terrace', label: 'Stepped Biophilic Terraces', desc: 'Terraced roof gardens reducing wind shear' },
                      { id: 'biophilic_podium', label: 'Biophilic Podium', desc: 'Active street-level atrium with slender tower' },
                      { id: 'courtyard_metabolism', label: 'Courtyard Metabolism', desc: 'Central open microclimate light courtyard' },
                    ].map((typ) => (
                      <button
                        key={typ.id}
                        onClick={() => handleParameterChange('typology', typ.id)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          parameters.typology === typ.id
                            ? 'bg-amber-950/40 border border-amber-500/60 shadow-sm'
                            : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">{typ.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{typ.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Superstructure Framework */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <TreePine className="w-3.5 h-3.5 text-emerald-400" /> Primary Structural Framework
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'glulam_mass_timber',
                        label: 'Glulam Timber & CLT (Biogenic)',
                        gwp: '92 kgCO₂e/m²',
                        desc: 'European spruce timber locking 280 kgCO₂/m²',
                      },
                      {
                        id: 'hybrid_timber_steel',
                        label: 'Hybrid Timber & Recycled Steel',
                        gwp: '185 kgCO₂e/m²',
                        desc: '93% scrap electric arc steel with CLT decks',
                      },
                      {
                        id: 'low_carbon_concrete',
                        label: 'Low-Carbon Geopolymer Concrete',
                        gwp: '260 kgCO₂e/m²',
                        desc: '70% slag byproduct cement replacement',
                      },
                      {
                        id: 'recycled_structural_steel',
                        label: 'Recycled Structural Steel Framing',
                        gwp: '295 kgCO₂e/m²',
                        desc: 'Moment frames with lightweight deck system',
                      },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleParameterChange('primaryStructure', st.id)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          parameters.primaryStructure === st.id
                            ? 'bg-emerald-950/40 border border-emerald-500/60 shadow-sm'
                            : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{st.label}</span>
                          <span className="text-[10px] font-mono text-emerald-400">{st.gwp}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Insulation Type */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">
                    Thermal Envelope Infill (Cradle-to-Cradle)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'mycelium_bio_composite', label: 'Mycelium Bio-Composite', rate: 'R-3.8/in · Carbon Negative' },
                      { id: 'dense_pack_cellulose', label: 'Dense-Pack Recycled Cellulose', rate: 'R-3.7/in · 85% Recycled' },
                      { id: 'wood_fiber', label: 'Continuous Wood Fiber Board', rate: 'R-3.6/in · Carbon Storing' },
                      { id: 'mineral_wool', label: 'Standard Mineral Basalt Wool', rate: 'R-4.2/in · Fire Incombustible' },
                    ].map((ins) => (
                      <button
                        key={ins.id}
                        onClick={() => handleParameterChange('insulationType', ins.id)}
                        className={`p-2.5 rounded-lg text-left text-xs transition-all ${
                          parameters.insulationType === ins.id
                            ? 'bg-slate-800 border border-amber-500/60 text-white'
                            : 'bg-[#111A2E]/60 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-medium text-white">{ins.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ins.rate}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sustainability Portfolio Brief Export Modal */}
      <PortfolioBriefModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        parameters={parameters}
        metrics={metrics}
        debateTurns={debateTurns}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SymbiocenApp />
    </QueryClientProvider>
  );
}
