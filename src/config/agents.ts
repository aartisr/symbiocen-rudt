import type { LucideIcon } from 'lucide-react';
import { Activity, Compass, Layers, Leaf } from 'lucide-react';
import type { AgentId } from '../types';

export interface AgentPresentation {
  id: AgentId;
  name: string;
  role: string;
  icon: LucideIcon;
  accentClass: string;
  borderClass: string;
  backgroundClass: string;
}

export const AGENT_REGISTRY: Record<AgentId, AgentPresentation> = {
  architect: {
    id: 'architect',
    name: 'Elena Rostova, AIA',
    role: 'Lead Design Architect',
    icon: Compass,
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    backgroundClass: 'bg-amber-500/10',
  },
  engineer: {
    id: 'engineer',
    name: 'Marcus Vance, PE, SE',
    role: 'Senior Structural & MEP Engineer',
    icon: Activity,
    accentClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    backgroundClass: 'bg-sky-500/10',
  },
  constructor: {
    id: 'constructor',
    name: 'David Chen, CCM',
    role: 'Virtual Construction Manager',
    icon: Layers,
    accentClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/30',
    backgroundClass: 'bg-indigo-500/10',
  },
  ecologist: {
    id: 'ecologist',
    name: 'Dr. Soraya Morales',
    role: 'Regenerative Systems Ecologist',
    icon: Leaf,
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    backgroundClass: 'bg-emerald-500/10',
  },
};

export const AGENT_IDS = Object.freeze(Object.keys(AGENT_REGISTRY) as AgentId[]);

export function getAgentPresentation(agentId: AgentId): AgentPresentation {
  return AGENT_REGISTRY[agentId];
}