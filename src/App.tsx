import { lazy, Suspense, useState } from 'react';
import { ShaderMode } from './types';
import { TopBar } from './components/navigation/TopBar';
import { ThreeDigitalTwin } from './components/viewport/ThreeDigitalTwin';
import { AgentCouncilPanel } from './components/agents/AgentCouncilPanel';
import { useDesignParameters } from './hooks/useDesignParameters';
import { useSimulation } from './hooks/useSimulation';
import { useAgentCouncil } from './hooks/useAgentCouncil';
import {
  Sliders,
  Cpu,
  Table as TableIcon,
  Sparkles,
} from 'lucide-react';

const CarbonInventoryTable = lazy(() =>
  import('./components/inventory/CarbonInventoryTable').then((module) => ({ default: module.CarbonInventoryTable })),
);
const SystemsCoDesignGraph = lazy(() =>
  import('./components/agents/SystemsCoDesignGraph').then((module) => ({ default: module.SystemsCoDesignGraph })),
);
const PortfolioBriefModal = lazy(() =>
  import('./components/export/PortfolioBriefModal').then((module) => ({ default: module.PortfolioBriefModal })),
);
const SiteStudio = lazy(() =>
  import('./components/site/SiteStudio').then((module) => ({ default: module.SiteStudio })),
);

function FeatureFallback() {
  return (
    <div className="grid h-full place-items-center" role="status" aria-label="Loading workspace">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400" />
    </div>
  );
}

function SymbiocenApp() {
  const { parameters, updateParameter, applyTweak, applyStrategy, applyAlternative } = useDesignParameters();
  const { metrics, materials } = useSimulation(parameters);
  const { debateTurns, isDeliberating, triggerDeliberation } = useAgentCouncil(parameters, metrics);
  const [shaderMode, setShaderMode] = useState<ShaderMode>('pbr');
  const [activeRightTab, setActiveRightTab] = useState<'agents' | 'inventory' | 'graph' | 'site'>('agents');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070A10] text-slate-100 font-['Public_Sans',sans-serif]">
      <h1 className="sr-only">Symbiocen regenerative urban design digital twin</h1>
      <p className="sr-only">
        Explore early-stage building decisions across whole-life carbon, operational energy,
        daylight, structural performance, ecology, materials, and climate-responsive design.
      </p>
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Pane: 3D Digital Twin Viewport (52% on desktop) */}
        <div className="w-full lg:w-[52%] h-[55dvh] lg:h-full min-w-0 min-h-0 relative overflow-hidden border-r border-slate-800/80 shrink-0">
          <ThreeDigitalTwin
            parameters={parameters}
            metrics={metrics}
            onParameterChange={updateParameter}
            shaderMode={shaderMode}
            onShaderModeChange={setShaderMode}
          />
        </div>

        {/* Right Pane: Multi-Agent Council & Metabolic Engineering Tools (48%) */}
        <div className="w-full lg:w-[48%] h-[calc(100dvh-3.75rem)] lg:h-full min-w-0 min-h-0 flex flex-col bg-[#0A0E17] overflow-hidden shrink-0">
          {/* Right Pane Segmented Tabs */}
          <div className="flex items-center justify-between overflow-x-auto px-4 py-2.5 bg-[#0D121F] border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1 p-0.5 bg-[#070A10] rounded-lg border border-slate-800/80 shrink-0">
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
            <Suspense fallback={<FeatureFallback />}>
              {activeRightTab === 'agents' && (
                <AgentCouncilPanel
                  debateTurns={debateTurns}
                  isDeliberating={isDeliberating}
                  onTriggerDeliberation={triggerDeliberation}
                  onApplyTweak={applyTweak}
                  parameters={parameters}
                  metrics={metrics}
                />
              )}

              {activeRightTab === 'inventory' && (
                <CarbonInventoryTable
                  items={materials}
                  metrics={metrics}
                  onApplyAlternative={applyAlternative}
                />
              )}

              {activeRightTab === 'graph' && (
                <SystemsCoDesignGraph
                  parameters={parameters}
                  metrics={metrics}
                />
              )}

              {activeRightTab === 'site' && (
                <SiteStudio
                  parameters={parameters}
                  onParameterChange={updateParameter}
                  onApplyStrategy={applyStrategy}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>

      {/* Sustainability Portfolio Brief Export Modal */}
      {isExportModalOpen && (
        <Suspense fallback={null}>
          <PortfolioBriefModal
            isOpen
            onClose={() => setIsExportModalOpen(false)}
            parameters={parameters}
            metrics={metrics}
            debateTurns={debateTurns}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return <SymbiocenApp />;
}
