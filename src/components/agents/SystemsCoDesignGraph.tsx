import React, { useState } from 'react';
import { BuildingParameters, SimulationMetrics } from '../../types';
import {
  Compass,
  Activity,
  Layers,
  Leaf,
  Sliders,
  Cpu,
  BarChart3,
  Sun,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface SystemsCoDesignGraphProps {
  parameters: BuildingParameters;
  metrics: SimulationMetrics;
  onSelectParameterNode?: (paramKey: keyof BuildingParameters) => void;
}

interface GraphNode {
  id: string;
  title: string;
  subtitle: string;
  category: 'input' | 'agent' | 'metric';
  x: number;
  y: number;
  val?: string | number;
  icon?: any;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
  color?: string;
}

export const SystemsCoDesignGraph: React.FC<SystemsCoDesignGraphProps> = ({
  parameters,
  metrics,
  onSelectParameterNode,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Layout coordinates for 3-column systems loop
  const nodes: GraphNode[] = [
    // Column 1: Inputs / Parameters
    {
      id: 'param-typology',
      title: 'Massing Typology',
      subtitle: parameters.typology.replace(/_/g, ' '),
      category: 'input',
      x: 70,
      y: 50,
      color: '#F59E0B',
    },
    {
      id: 'param-storeys',
      title: 'Height / Floors',
      subtitle: `${parameters.floors} storeys (${metrics.buildingHeightM}m)`,
      category: 'input',
      x: 70,
      y: 130,
      color: '#F59E0B',
    },
    {
      id: 'param-structure',
      title: 'Superstructure',
      subtitle: parameters.primaryStructure.replace(/_/g, ' '),
      category: 'input',
      x: 70,
      y: 210,
      color: '#F59E0B',
    },
    {
      id: 'param-wwr',
      title: 'Window-to-Wall',
      subtitle: `${Math.round(parameters.windowToWallRatio * 100)}% + ${parameters.shadingLouverDepth}m louvers`,
      category: 'input',
      x: 70,
      y: 290,
      color: '#F59E0B',
    },
    {
      id: 'param-green',
      title: 'Canopy & Roof',
      subtitle: `${parameters.greenRoofCoverage}% Sedum + ${parameters.photovoltaicCoverage}% PV`,
      category: 'input',
      x: 70,
      y: 370,
      color: '#F59E0B',
    },

    // Column 2: ACE Disciplinary Agents
    {
      id: 'agent-arch',
      title: 'Architect Agent',
      subtitle: 'Elena Rostova, AIA',
      category: 'agent',
      x: 290,
      y: 70,
      icon: Compass,
      color: '#D97706',
    },
    {
      id: 'agent-eng',
      title: 'Engineer Agent',
      subtitle: 'Marcus Vance, PE',
      category: 'agent',
      x: 290,
      y: 160,
      icon: Activity,
      color: '#0284C7',
    },
    {
      id: 'agent-con',
      title: 'Constructor Agent',
      subtitle: 'David Chen, CCM',
      category: 'agent',
      x: 290,
      y: 250,
      icon: Layers,
      color: '#6366F1',
    },
    {
      id: 'agent-eco',
      title: 'Ecologist Agent',
      subtitle: 'Dr. Soraya Morales',
      category: 'agent',
      x: 290,
      y: 340,
      icon: Leaf,
      color: '#10B981',
    },

    // Column 3: Metabolic Simulation Sinks
    {
      id: 'sink-carbon',
      title: 'Embodied Carbon',
      subtitle: `${metrics.embodiedCarbon.perSqMeter} kgCO₂e/m² (Grade ${metrics.embodiedCarbon.rating})`,
      category: 'metric',
      x: 510,
      y: 60,
      color: '#10B981',
    },
    {
      id: 'sink-energy',
      title: 'EUI & Microclimate',
      subtitle: `${metrics.operationalEnergy.euiKwhPerSqMYear} kWh/m²/yr (${metrics.operationalEnergy.netZeroReadinessPercent}% Net Zero)`,
      category: 'metric',
      x: 510,
      y: 140,
      color: '#0284C7',
    },
    {
      id: 'sink-daylight',
      title: 'Spatial Daylight',
      subtitle: `${metrics.daylight.sda300_50}% sDA (${metrics.daylight.naturalLuxAverage} lux)`,
      category: 'metric',
      x: 510,
      y: 220,
      color: '#F59E0B',
    },
    {
      id: 'sink-structural',
      title: 'Wind Deflection',
      subtitle: `${metrics.structural.maxDeflectionMm}mm (${metrics.structural.lateralDriftRatio})`,
      category: 'metric',
      x: 510,
      y: 300,
      color: '#6366F1',
    },
    {
      id: 'sink-biodiversity',
      title: 'Biophilic Storage',
      subtitle: `${(metrics.embodiedCarbon.biogenicCarbonStoredKg / 1000).toFixed(0)}t Biogenic CO₂ Stored`,
      category: 'metric',
      x: 510,
      y: 380,
      color: '#10B981',
    },
  ];

  // Interdisciplinary systemic edges
  const edges: GraphEdge[] = [
    // Parameters to Agents
    { from: 'param-typology', to: 'agent-arch' },
    { from: 'param-typology', to: 'agent-eng' },
    { from: 'param-storeys', to: 'agent-eng' },
    { from: 'param-storeys', to: 'agent-con' },
    { from: 'param-structure', to: 'agent-eng' },
    { from: 'param-structure', to: 'agent-con' },
    { from: 'param-structure', to: 'agent-eco' },
    { from: 'param-wwr', to: 'agent-arch' },
    { from: 'param-wwr', to: 'agent-eco' },
    { from: 'param-green', to: 'agent-eco' },
    { from: 'param-green', to: 'agent-arch' },

    // Agents to Physical Simulation Sinks
    { from: 'agent-arch', to: 'sink-daylight' },
    { from: 'agent-eng', to: 'sink-structural' },
    { from: 'agent-eng', to: 'sink-energy' },
    { from: 'agent-con', to: 'sink-carbon' },
    { from: 'agent-eco', to: 'sink-carbon' },
    { from: 'agent-eco', to: 'sink-biodiversity' },
    { from: 'agent-eco', to: 'sink-energy' },
  ];

  const isEdgeHighlighted = (edge: GraphEdge) => {
    if (!selectedNode) return true;
    return edge.from === selectedNode || edge.to === selectedNode;
  };

  return (
    <div className="flex flex-col h-full bg-[#0E1524] rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-[#111A2E] border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Metabolic Systems Co-Design Graph
          </h2>
          <p className="text-[11px] text-slate-400">
            Interactive parameter-to-agent-to-metric dependency network. Click any node to inspect causality.
          </p>
        </div>
        {selectedNode && (
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-auto p-4 flex justify-center items-center min-h-[440px]">
        <svg
          viewBox="0 0 620 440"
          className="w-full max-w-2xl h-auto select-none"
        >
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Render connecting edges */}
          {edges.map((edge, idx) => {
            const source = nodes.find((n) => n.id === edge.from);
            const target = nodes.find((n) => n.id === edge.to);
            if (!source || !target) return null;

            const highlighted = isEdgeHighlighted(edge);
            const midX = (source.x + target.x) / 2;

            return (
              <path
                key={idx}
                d={`M ${source.x + 50} ${source.y + 16} C ${midX} ${source.y + 16}, ${midX} ${target.y + 16}, ${target.x - 50} ${target.y + 16}`}
                fill="none"
                stroke={highlighted ? (selectedNode ? 'url(#activeGrad)' : '#334155') : '#1e293b'}
                strokeWidth={highlighted && selectedNode ? 2.5 : 1.2}
                strokeDasharray={highlighted && selectedNode ? 'none' : '4,3'}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isRelated =
              selectedNode === null ||
              isSelected ||
              edges.some(
                (e) =>
                  (e.from === selectedNode && e.to === node.id) ||
                  (e.to === selectedNode && e.from === node.id)
              );

            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 55}, ${node.y})`}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                className="cursor-pointer group"
                opacity={isRelated ? 1 : 0.25}
              >
                {/* Node Box */}
                <rect
                  width="110"
                  height="34"
                  rx="6"
                  fill="#111A2E"
                  stroke={isSelected ? '#F59E0B' : '#334155'}
                  strokeWidth={isSelected ? 1.8 : 1}
                  className="transition-all duration-200 group-hover:stroke-slate-400 shadow-lg"
                />

                {/* Left accent bar */}
                <rect
                  x="0"
                  y="0"
                  width="3"
                  height="34"
                  rx="1"
                  fill={node.color}
                />

                {/* Node Text */}
                <text
                  x="8"
                  y="13"
                  fill="#F8FAFC"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="'Public Sans', sans-serif"
                >
                  {node.title}
                </text>
                <text
                  x="8"
                  y="25"
                  fill="#94A3B8"
                  fontSize="7.5"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {node.subtitle.length > 20 ? `${node.subtitle.slice(0, 19)}…` : node.subtitle}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Systems Summary Legend */}
      <div className="p-3 bg-[#0B0F17]/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-amber-500" />
            <span>Parametric Input</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-sky-500" />
            <span>ACE Agent Evaluator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500" />
            <span>Physics / Carbon Sink</span>
          </div>
        </div>
        <span className="text-slate-500 font-mono">Real-time Closed-Loop Feedback</span>
      </div>
    </div>
  );
};
