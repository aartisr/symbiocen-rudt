import React from 'react';
import { BuildingParameters, SimulationMetrics, AgentDebateTurn } from '../../types';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Leaf,
  Activity,
  Award,
  Calendar,
  MapPin,
  Building2,
} from 'lucide-react';

interface PortfolioBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: BuildingParameters;
  metrics: SimulationMetrics;
  debateTurns: AgentDebateTurn[];
}

export const PortfolioBriefModal: React.FC<PortfolioBriefModalProps> = ({
  isOpen,
  onClose,
  parameters,
  metrics,
  debateTurns,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none print:bg-white print:text-black">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 bg-[#1E293B] border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              ACE Mentor Program — Executive Sustainability Design Brief
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Document */}
        <div className="p-8 space-y-6 text-slate-300 print:text-slate-900 print:p-6">
          {/* Header Section */}
          <div className="border-b border-slate-700 print:border-slate-300 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-amber-400 print:text-amber-700 uppercase tracking-widest font-semibold">
                  Symbiocen Regenerative Digital Twin
                </span>
                <h1 className="text-2xl font-bold text-white print:text-black mt-1 font-serif">
                  Metabolic Urban Intervention Brief
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 print:text-slate-600 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {parameters.siteLocation}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {parameters.typology.replace(/_/g, ' ')}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Cohort Assessment: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 print:bg-emerald-50 print:border-emerald-300">
                  <span className="text-xs font-bold text-emerald-400 print:text-emerald-800">
                    Grade {metrics.embodiedCarbon.rating} Net-Zero Ready
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 print:text-slate-600 mt-1">
                  BERDO 2.0 & MA Stretch Code Compliant
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Executive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#1E293B]/60 print:bg-slate-100 border border-slate-700/80 print:border-slate-300">
            <div>
              <div className="text-xs text-slate-400 print:text-slate-600">Embodied Carbon</div>
              <div className="text-xl font-bold font-mono text-white print:text-black">
                {metrics.embodiedCarbon.perSqMeter}{' '}
                <span className="text-xs font-normal text-slate-400">kgCO₂e/m²</span>
              </div>
              <div className="text-[10px] text-emerald-400 print:text-emerald-700 mt-0.5">
                {(metrics.embodiedCarbon.biogenicCarbonStoredKg / 1000).toFixed(0)}t Biogenic CO₂ Stored
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 print:text-slate-600">Operational EUI</div>
              <div className="text-xl font-bold font-mono text-white print:text-black">
                {metrics.operationalEnergy.euiKwhPerSqMYear}{' '}
                <span className="text-xs font-normal text-slate-400">kWh/m²/yr</span>
              </div>
              <div className="text-[10px] text-sky-400 print:text-sky-700 mt-0.5">
                {metrics.operationalEnergy.netZeroReadinessPercent}% Solar Offset
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 print:text-slate-600">Daylight Autonomy</div>
              <div className="text-xl font-bold font-mono text-white print:text-black">
                {metrics.daylight.sda300_50}%{' '}
                <span className="text-xs font-normal text-slate-400">sDA 300/50%</span>
              </div>
              <div className="text-[10px] text-amber-400 print:text-amber-700 mt-0.5">
                {metrics.daylight.naturalLuxAverage} Lux Avg Daylight
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 print:text-slate-600">Structural Drift</div>
              <div className="text-xl font-bold font-mono text-white print:text-black">
                {metrics.structural.lateralDriftRatio}
              </div>
              <div className="text-[10px] text-emerald-400 print:text-emerald-700 mt-0.5">
                Safety Factor: {metrics.structural.safetyFactor} (Compliant)
              </div>
            </div>
          </div>

          {/* Section: Architectural & Engineering Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Parametric Massing & Envelope
              </h4>
              <ul className="text-xs space-y-1.5 text-slate-300 print:text-slate-800">
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Gross Floor Area (GFA):</span>
                  <span className="font-mono">{metrics.grossFloorAreaSqM.toLocaleString()} m²</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Building Height & Storeys:</span>
                  <span className="font-mono">{parameters.floors} floors ({metrics.buildingHeightM}m)</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Window-to-Wall Ratio (WWR):</span>
                  <span className="font-mono">{Math.round(parameters.windowToWallRatio * 100)}%</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Exterior Sunshade Louvers:</span>
                  <span className="font-mono">{parameters.shadingLouverDepth}m terracotta baguettes</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Glazing Specification:</span>
                  <span className="capitalize">{parameters.glazingType.replace(/_/g, ' ')}</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
                Materials & Circularity
              </h4>
              <ul className="text-xs space-y-1.5 text-slate-300 print:text-slate-800">
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Primary Structural Frame:</span>
                  <span className="capitalize font-semibold text-amber-400 print:text-amber-800">
                    {parameters.primaryStructure.replace(/_/g, ' ')}
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Thermal Envelope Insulation:</span>
                  <span className="capitalize">{parameters.insulationType.replace(/_/g, ' ')}</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Living Roof Canopy:</span>
                  <span className="font-mono">{parameters.greenRoofCoverage}% Sedum ({metrics.biophilic.greenCoverSqM} m²)</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Rooftop Solar Photovoltaics:</span>
                  <span className="font-mono">{parameters.photovoltaicCoverage}% ({metrics.operationalEnergy.solarGenerationKwhYear.toLocaleString()} kWh/yr)</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 print:border-slate-200 pb-1">
                  <span>Circularity & Salvageability:</span>
                  <span className="font-mono">{metrics.embodiedCarbon.circularityIndex}% Cradle-to-Cradle</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Disciplinary Mentor Council Synthesis */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-700">
              ACE Disciplinary Mentor Council Synthesis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {debateTurns.map((turn) => (
                <div
                  key={turn.id}
                  className="p-3 rounded-lg bg-[#1E293B]/40 print:bg-slate-50 border border-slate-700/60 print:border-slate-300 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white print:text-black">{turn.roleName}</span>
                    <span className="text-[10px] text-slate-400 print:text-slate-600 font-mono">
                      {turn.keyMetric}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-amber-400 print:text-amber-800 mb-1">
                    {turn.headline}
                  </div>
                  <p className="text-[11px] text-slate-300 print:text-slate-700 leading-normal">
                    {turn.commentary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer certification */}
          <div className="border-t border-slate-700 print:border-slate-300 pt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>Generated with Symbiocen Generative AI & Digital Twin Engine</span>
            <span>ACE Mentor Program Architecture & Engineering Submission</span>
          </div>
        </div>
      </div>
    </div>
  );
};
