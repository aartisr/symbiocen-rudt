import type { AgentDebateTurn, AgentId, BuildingParameters, SimulationMetrics } from '../types';

export interface DesignContext {
  parameters: BuildingParameters;
  metrics: SimulationMetrics;
}

export interface AgentConsultationRequest extends DesignContext {
  agentId: AgentId;
  question: string;
}

export interface AgentConsultationResponse {
  agentId: AgentId;
  agentName: string;
  role: string;
  reply: string;
}

export interface AgentClient {
  deliberate(context: DesignContext, onTurn: (turn: AgentDebateTurn) => void, signal?: AbortSignal): Promise<void>;
  consult(request: AgentConsultationRequest, signal?: AbortSignal): Promise<AgentConsultationResponse>;
}

interface ServerSentEvent {
  event: string;
  data: string;
}

export function parseServerSentEvent(block: string): ServerSentEvent | null {
  let event = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  return data.length > 0 ? { event, data: data.join('\n') } : null;
}

async function readEventStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ServerSentEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const event = parseServerSentEvent(block);
        if (event) onEvent(event);
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
}

export class HttpAgentClient implements AgentClient {
  constructor(private readonly baseUrl = '/api/agents') {}

  async deliberate(
    context: DesignContext,
    onTurn: (turn: AgentDebateTurn) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/deliberate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(`Council deliberation failed with status ${response.status}`);
    }

    await readEventStream(response.body, ({ event, data }) => {
      if (event === 'agent_turn') onTurn(JSON.parse(data) as AgentDebateTurn);
      if (event === 'error') throw new Error(JSON.parse(data).message ?? 'Council deliberation failed');
    });
  }

  async consult(request: AgentConsultationRequest, signal?: AbortSignal): Promise<AgentConsultationResponse> {
    const response = await fetch(`${this.baseUrl}/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
    if (!response.ok) throw new Error(`Agent consultation failed with status ${response.status}`);
    return response.json() as Promise<AgentConsultationResponse>;
  }
}

export const defaultAgentClient = new HttpAgentClient();