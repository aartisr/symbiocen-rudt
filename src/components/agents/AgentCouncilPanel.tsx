import React, { useState } from 'react';
import {
  AgentDebateTurn,
  AgentId,
  BuildingParameters,
  SimulationMetrics,
  ParameterTweak,
} from '../../types';
import {
  Compass,
  Activity,
  Layers,
  Leaf,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  MessageSquare,
  Send,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

interface AgentCouncilPanelProps {
  debateTurns: AgentDebateTurn[];
  isDeliberating: boolean;
  onTriggerDeliberation: () => void;
  onApplyTweak: (tweak: ParameterTweak) => void;
  parameters: BuildingParameters;
  metrics: SimulationMetrics;
}

export const AgentCouncilPanel: React.FC<AgentCouncilPanelProps> = ({
  debateTurns,
  isDeliberating,
  onTriggerDeliberation,
  onApplyTweak,
  parameters,
  metrics,
}) => {
  const [selectedAgentForChat, setSelectedAgentForChat] = useState<AgentId | null>(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: 'user' | 'agent'; text: string; agentName?: string }>
  >([]);
  const [isConsulting, setIsConsulting] = useState(false);

  const getAgentMeta = (agentId: AgentId) => {
    switch (agentId) {
      case 'architect':
        return {
          name: 'Elena Rostova, AIA',
          role: 'Lead Design Architect',
          icon: Compass,
          accent: 'text-amber-400',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
        };
      case 'engineer':
        return {
          name: 'Marcus Vance, PE, SE',
          role: 'Senior Structural & MEP Engineer',
          icon: Activity,
          accent: 'text-sky-400',
          border: 'border-sky-500/30',
          bg: 'bg-sky-500/10',
        };
      case 'constructor':
        return {
          name: 'David Chen, CCM',
          role: 'Virtual Construction Manager',
          icon: Layers,
          accent: 'text-indigo-400',
          border: 'border-indigo-500/30',
          bg: 'bg-indigo-500/10',
        };
      case 'ecologist':
        return {
          name: 'Dr. Soraya Morales',
          role: 'Regenerative Systems Ecologist',
          icon: Leaf,
          accent: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10',
        };
    }
  };

  const handleAskAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !selectedAgentForChat || isConsulting) return;

    const userQ = chatQuestion;
    setChatQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userQ }]);
    setIsConsulting(true);

    try {
      const res = await fetch('/api/agents/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentForChat,
          question: userQ,
          parameters,
          metrics,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: 'agent', text: data.reply || 'No answer available.', agentName: data.agentName },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'agent', text: 'Consultation service unavailable. Check connection.' },
      ]);
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0E1524] rounded-xl border border-slate-800 overflow-hidden">
      {/* Header with Run Deliberation Action */}
      <div className="flex items-center justify-between p-3.5 bg-[#111A2E] border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            ACE Multi-Disciplinary Council
          </h2>
          <p className="text-[11px] text-slate-400">
            Autonomous peer-review across architectural flow, structural mechanics, and carbon lifecycle
          </p>
        </div>

        <button
          onClick={onTriggerDeliberation}
          disabled={isDeliberating}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-md active:scale-95"
        >
          {isDeliberating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Deliberating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Council Review</span>
            </>
          )}
        </button>
      </div>

      {/* Disciplinary Mentors Quick Select Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#0B0F17]/50 border-b border-slate-800/80">
        {(['architect', 'engineer', 'constructor', 'ecologist'] as AgentId[]).map((agentId) => {
          const meta = getAgentMeta(agentId);
          const Icon = meta.icon;
          const isSelected = selectedAgentForChat === agentId;
          return (
            <button
              key={agentId}
              onClick={() => setSelectedAgentForChat(isSelected ? null : agentId)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 border border-amber-500/60 shadow-sm'
                  : 'bg-slate-850/40 hover:bg-slate-800/60 border border-slate-800/60'
              }`}
            >
              <div className={`p-1.5 rounded-md ${meta.bg} ${meta.border} ${meta.accent}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white truncate">{meta.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{meta.role}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Deliberation Feed or Direct Inquiry Box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {selectedAgentForChat ? (
          /* Single-Agent Direct Q&A Console */
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Consulting: {getAgentMeta(selectedAgentForChat).name}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({getAgentMeta(selectedAgentForChat).role})
                </span>
              </div>
              <button
                onClick={() => setSelectedAgentForChat(null)}
                className="text-xs text-amber-500 hover:text-amber-400"
              >
                Back to Council Feed
              </button>
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[220px] max-h-[380px] pr-1">
              <div className="p-3 rounded-lg bg-slate-850/60 border border-slate-800 text-xs text-slate-300">
                Hello student team! I am your {getAgentMeta(selectedAgentForChat).role}. Ask me anything about
                optimizing the structural sizing, timber prefabrication, daylight autonomy, or emissions for your
                design.
              </div>
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-xs ${
                    msg.sender === 'user'
                      ? 'bg-amber-950/40 border border-amber-900/60 text-amber-200 ml-6'
                      : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 mr-6'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-400 mb-1">
                    {msg.sender === 'user' ? 'Student Inquiry' : msg.agentName || 'Agent'}
                  </div>
                  <div className="leading-relaxed">{msg.text}</div>
                </div>
              ))}
              {isConsulting && (
                <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Evaluating parametric physics constraints...</span>
                </div>
              )}
            </div>

            {/* Prompt input */}
            <form onSubmit={handleAskAgent} className="flex gap-2 pt-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder={`Ask ${getAgentMeta(selectedAgentForChat).name.split(',')[0]} a question...`}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#0B0F17] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isConsulting || !chatQuestion.trim()}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        ) : (
          /* Multi-Agent Live Deliberation Turns */
          <>
            {debateTurns.map((turn) => {
              const meta = getAgentMeta(turn.agentId);
              const Icon = meta.icon;

              return (
                <div
                  key={turn.id}
                  className="p-3.5 rounded-xl bg-[#111A2E]/80 border border-slate-800 hover:border-slate-750 transition-all shadow-sm"
                >
                  {/* Agent Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${meta.bg} ${meta.border} ${meta.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{turn.roleName}</span>
                          <span className="text-[10px] text-slate-400">· {turn.roleTitle}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-0.5">
                          {turn.headline}
                        </div>
                      </div>
                    </div>

                    {/* Status indicator with explicit text */}
                    <div className="flex items-center gap-1.5">
                      {turn.status === 'approved' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Compliant
                        </span>
                      )}
                      {turn.status === 'concern' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-400" /> Caution
                        </span>
                      )}
                      {turn.status === 'critical' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                          <AlertOctagon className="w-3 h-3 text-rose-400" /> Revision Req
                        </span>
                      )}
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                        {turn.keyMetric}
                      </span>
                    </div>
                  </div>

                  {/* Agent Commentary */}
                  <p className="text-xs text-slate-300 leading-relaxed pl-8 mb-3">
                    {turn.commentary}
                  </p>

                  {/* Suggested Tweaks Action Cards */}
                  {turn.suggestedTweaks && turn.suggestedTweaks.length > 0 && (
                    <div className="pl-8 space-y-2">
                      {turn.suggestedTweaks.map((tweak, tidx) => (
                        <div
                          key={tidx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0F17]/90 border border-slate-800/80 text-xs"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                              <SlidersHorizontal className="w-3 h-3 text-amber-500" />
                              <span>
                                Adjust <strong className="text-white">{String(tweak.parameter)}</strong> to{' '}
                                <strong className="text-amber-400">{String(tweak.suggestedVal)}</strong>
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {tweak.rationale}
                            </div>
                          </div>

                          <button
                            onClick={() => onApplyTweak(tweak)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 hover:border-amber-500 text-[11px] font-semibold text-amber-300 hover:text-white transition-all whitespace-nowrap shrink-0"
                          >
                            <span>Adopt Tweak</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
