import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialDebateTurns } from '../config/design';
import { defaultAgentClient, type AgentClient } from '../services/agentClient';
import type { AgentDebateTurn, BuildingParameters, SimulationMetrics } from '../types';

function upsertTurn(turns: AgentDebateTurn[], turn: AgentDebateTurn): AgentDebateTurn[] {
  const index = turns.findIndex((current) => current.agentId === turn.agentId);
  if (index < 0) return [turn, ...turns];
  const next = [...turns];
  next[index] = turn;
  return next;
}

export function useAgentCouncil(
  parameters: BuildingParameters,
  metrics: SimulationMetrics,
  client: AgentClient = defaultAgentClient,
) {
  const [debateTurns, setDebateTurns] = useState<AgentDebateTurn[]>(createInitialDebateTurns);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const triggerDeliberation = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsDeliberating(true);
    try {
      await client.deliberate(
        { parameters, metrics },
        (turn) => setDebateTurns((current) => upsertTurn(current, turn)),
        controller.signal,
      );
    } catch (error) {
      if (!controller.signal.aborted) console.error('Deliberation streaming failed:', error);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsDeliberating(false);
      }
    }
  }, [client, metrics, parameters]);

  return { debateTurns, isDeliberating, triggerDeliberation };
}