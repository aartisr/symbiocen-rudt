import React from 'react';
import { Award } from 'lucide-react';

interface TopBarProps {
  activeTab: 'twin' | 'agents' | 'inventory' | 'graph';
  onSelectTab: (tab: 'twin' | 'agents' | 'inventory' | 'graph') => void;
  onOpenExportModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExportModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0A0E17] border-b border-slate-800/80 shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('twin');
        }}
        className="text-lg font-bold tracking-tight text-white font-['Outfit'] whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
      >
        Symbiocen
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('twin')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'twin' ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          3D Digital Twin
        </button>
        <button
          onClick={() => onSelectTab('agents')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'agents' ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Agent Council
        </button>
        <button
          onClick={() => onSelectTab('inventory')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'inventory' ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Carbon Inventory
        </button>
        <button
          onClick={() => onSelectTab('graph')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'graph' ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Systems Graph
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 active:scale-95 shadow-sm"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Export Brief</span>
        </button>
      </div>
    </header>
  );
};
