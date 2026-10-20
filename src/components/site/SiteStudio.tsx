import { memo } from 'react';
import { Building2, MapPin, TreePine } from 'lucide-react';
import { INSULATION_OPTIONS, SITE_OPTIONS, STRUCTURE_OPTIONS, TYPOLOGY_OPTIONS } from '../../config/design';
import type { BuildingParameters } from '../../types';
import type { ClimateStrategyRecommendation } from '../../utils/climateData';
import { SiteClimateChart } from '../charts/SiteClimateChart';

interface SiteStudioProps {
  parameters: BuildingParameters;
  onParameterChange: <Key extends keyof BuildingParameters>(key: Key, value: BuildingParameters[Key]) => void;
  onApplyStrategy: (strategy: ClimateStrategyRecommendation) => void;
}

function SiteStudioComponent({ parameters, onParameterChange, onApplyStrategy }: SiteStudioProps) {
  return (
    <div className="h-full bg-[#0E1524] rounded-xl border border-slate-800 p-5 overflow-y-auto space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white">Project Context & Typology Studio</h3>
        <p className="text-xs text-slate-400 mt-0.5">Configure regional climate zone, massing archetype, and primary low-carbon structural framework</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Site Location & Climate Standard</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SITE_OPTIONS.map((site) => (
            <button key={site.name} onClick={() => onParameterChange('siteLocation', site.name)} className={`p-3 rounded-lg text-left transition-all ${parameters.siteLocation === site.name ? 'bg-amber-950/40 border border-amber-500/60 shadow-sm' : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'}`}>
              <div className="text-xs font-semibold text-white">{site.name}</div><div className="text-[11px] text-slate-400 mt-0.5">{site.zone}</div><div className="text-[10px] text-slate-500 mt-1 font-mono">{site.wind}</div>
            </button>
          ))}
        </div>
      </div>
      <SiteClimateChart siteLocation={parameters.siteLocation} onApplyStrategy={onApplyStrategy} />
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-400" /> Massing Archetype</label>
        <div className="grid grid-cols-2 gap-2.5">
          {TYPOLOGY_OPTIONS.map((option) => (
            <button key={option.id} onClick={() => onParameterChange('typology', option.id)} className={`p-3 rounded-lg text-left transition-all ${parameters.typology === option.id ? 'bg-amber-950/40 border border-amber-500/60 shadow-sm' : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'}`}>
              <div className="text-xs font-semibold text-white">{option.label}</div><div className="text-[11px] text-slate-400 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><TreePine className="w-3.5 h-3.5 text-emerald-400" /> Primary Structural Framework</label>
        <div className="grid grid-cols-2 gap-2.5">
          {STRUCTURE_OPTIONS.map((option) => (
            <button key={option.id} onClick={() => onParameterChange('primaryStructure', option.id)} className={`p-3 rounded-lg text-left transition-all ${parameters.primaryStructure === option.id ? 'bg-emerald-950/40 border border-emerald-500/60 shadow-sm' : 'bg-[#111A2E]/60 hover:bg-[#111A2E] border border-slate-800'}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">{option.label}</span><span className="text-[10px] font-mono text-emerald-400">{option.gwp}</span></div><div className="text-[11px] text-slate-400 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-300">Thermal Envelope Infill (Cradle-to-Cradle)</label>
        <div className="grid grid-cols-2 gap-2">
          {INSULATION_OPTIONS.map((option) => (
            <button key={option.id} onClick={() => onParameterChange('insulationType', option.id)} className={`p-2.5 rounded-lg text-left text-xs transition-all ${parameters.insulationType === option.id ? 'bg-slate-800 border border-amber-500/60 text-white' : 'bg-[#111A2E]/60 border border-slate-800 text-slate-400 hover:text-white'}`}>
              <div className="font-medium text-white">{option.label}</div><div className="text-[10px] text-slate-500 mt-0.5">{option.performance}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SiteStudio = memo(SiteStudioComponent);