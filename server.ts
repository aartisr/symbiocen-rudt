import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { calculateBuildingSimulation, generateMaterialInventory } from './src/utils/physicsEngine.ts';
import { BuildingParameters, SimulationMetrics, AgentDebateTurn } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Fast Physics & Carbon Simulation Calculation
app.post('/api/simulate/run', (req: Request, res: Response) => {
  try {
    const params = req.body as BuildingParameters;
    const metrics = calculateBuildingSimulation(params);
    const materials = generateMaterialInventory(params);
    res.json({ metrics, materials });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Simulation calculation failed' });
  }
});

// Preloaded Low-Carbon EC3 Materials Catalog
app.get('/api/materials/catalog', (_req: Request, res: Response) => {
  res.json([
    {
      id: 'cat-1',
      category: 'Superstructure',
      name: 'Glulam Timber GL28c (Spruce)',
      gwp: -410,
      unit: 'm³',
      embodiedType: 'Biogenic Carbon Sink',
      compliance: 'Mass Timber Code Type IV-A',
    },
    {
      id: 'cat-2',
      category: 'Superstructure',
      name: '5-Ply Cross-Laminated Timber (CLT)',
      gwp: -58,
      unit: 'm²',
      embodiedType: 'Bio-Composite Floor Diaphragm',
      compliance: 'IBC 2024 / PRG 320',
    },
    {
      id: 'cat-3',
      category: 'Substructure',
      name: 'Slag/Fly Ash Geopolymer Concrete',
      gwp: 115,
      unit: 'm³',
      embodiedType: '70% GGBS Industrial Byproduct',
      compliance: 'ACI 318 Durability Spec',
    },
    {
      id: 'cat-4',
      category: 'Envelope',
      name: 'Grown Mycelium Bio-Insulation',
      gwp: -18,
      unit: 'm³',
      embodiedType: 'Fungal Mycelium / Hemp Infill',
      compliance: 'ASTM E84 Class A Fire Rated',
    },
    {
      id: 'cat-5',
      category: 'Envelope',
      name: 'Dynamic Electrochromic Smart Glass',
      gwp: 72,
      unit: 'm²',
      embodiedType: 'Electronically Tintable Glazing',
      compliance: 'ASHRAE 90.1 Compliance',
    },
  ]);
});

// Multi-Agent Deliberation Council (Server-Sent Events streaming)
app.post('/api/agents/deliberate', async (req: Request, res: Response) => {
  const { parameters, metrics } = req.body as {
    parameters: BuildingParameters;
    metrics: SimulationMetrics;
  };

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const prompt = `
You are orchestrating the Symbiocen ACE Mentorship Multi-Agent Council for high school and university students co-designing an urban regenerative building.
The student has submitted the following design state:
Parameters:
- Typology: ${parameters.typology}
- Floors: ${parameters.floors} floors (${metrics.buildingHeightM}m total height)
- Gross Floor Area: ${metrics.grossFloorAreaSqM} m²
- Structure: ${parameters.primaryStructure}
- Window-to-Wall Ratio: ${(parameters.windowToWallRatio * 100).toFixed(0)}%
- Shading Louvers: ${parameters.shadingLouverDepth}m
- Glazing: ${parameters.glazingType}
- Insulation: ${parameters.insulationType}
- Green Roof Coverage: ${parameters.greenRoofCoverage}%
- Solar PV Coverage: ${parameters.photovoltaicCoverage}%
- Site: ${parameters.siteLocation}

Computed Simulation Metrics:
- Embodied Carbon: ${metrics.embodiedCarbon.perSqMeter} kgCO2e/m² (Rating: ${metrics.embodiedCarbon.rating}, Net Biogenic Storage: ${(metrics.embodiedCarbon.biogenicCarbonStoredKg / 1000).toFixed(1)} tonnes CO2)
- Operational Energy (EUI): ${metrics.operationalEnergy.euiKwhPerSqMYear} kWh/m²/yr
- Net Zero Readiness: ${metrics.operationalEnergy.netZeroReadinessPercent}%
- Daylight Autonomy (sDA): ${metrics.daylight.sda300_50}%
- Structural Deflection: ${metrics.structural.maxDeflectionMm} mm (Allowable: ${metrics.structural.allowableDeflectionMm} mm, Drift: ${metrics.structural.lateralDriftRatio}, Status: ${metrics.structural.status})
- Biophilic Green Cover: ${metrics.biophilic.greenCoverSqM} m² (Retention: ${metrics.biophilic.stormwaterRetentionPercent}%)

Generate an insightful, concise critique from each of the 4 disciplinary agents in JSON format:
1. "architect": evaluates spatial circulation, natural light balance, occupant biophilic experience, and massing proportion.
2. "engineer": evaluates structural stiffness, lateral wind drift (H/400 standard), column spans, and HVAC peak load thermal sizing.
3. "constructor": evaluates off-site timber prefabrication sequencing, crane logistics, modular assembly scheduling, and constructability bottlenecks.
4. "ecologist": evaluates whole-life lifecycle carbon (A1-A5 vs B1-B6), BERDO/Stretch Energy Code compliance, urban pollinator habitat, and stormwater mitigation.

Format your response as a valid JSON array of 4 objects matching this structure:
[
  {
    "agentId": "architect" | "engineer" | "constructor" | "ecologist",
    "roleName": "Lead Design Architect" | "Senior Structural & MEP Engineer" | "Virtual Construction Manager" | "Regenerative Systems Ecologist",
    "roleTitle": string,
    "status": "approved" | "concern" | "critical",
    "headline": string (max 8 words),
    "commentary": string (2-3 concise educational sentences explaining the engineering rationale to students),
    "keyMetric": string (e.g. "sDA 74% Autonomy", "Wind Drift H/480", "12-Week Offsite Fab", "92 kgCO2e/m²"),
    "suggestedTweaks": [
      {
        "parameter": "windowToWallRatio" | "shadingLouverDepth" | "primaryStructure" | "greenRoofCoverage" | "floors" | "insulationType",
        "currentVal": any,
        "suggestedVal": any,
        "rationale": string,
        "impactMetric": string
      }
    ]
  }
]
`;

    // Check if Gemini API key exists
    if (!process.env.GEMINI_API_KEY) {
      // Provide high-fidelity rule-based council deliberation fallback
      const fallbackCouncil: AgentDebateTurn[] = [
        {
          id: `arch-${Date.now()}`,
          agentId: 'architect',
          roleName: 'Elena Rostova, AIA',
          roleTitle: 'Lead Design Architect',
          avatarIcon: 'Compass',
          status: metrics.daylight.sda300_50 >= 55 ? 'approved' : 'concern',
          headline: metrics.daylight.sda300_50 >= 55 ? 'Excellent Biophilic Daylight Envelope' : 'Deep Floorplate Restricts Daylight Core',
          commentary: `The ${(parameters.windowToWallRatio * 100).toFixed(0)}% aperture ratio achieves ${metrics.daylight.sda300_50}% spatial daylight autonomy across perimeter zones. Adding internal light wells or stepping the massing would enhance natural illumination in the core.`,
          keyMetric: `${metrics.daylight.sda300_50}% sDA Daylit`,
          timestamp: Date.now(),
          suggestedTweaks: [
            {
              parameter: 'shadingLouverDepth',
              currentVal: `${parameters.shadingLouverDepth}m`,
              suggestedVal: `${Math.min(1.0, parameters.shadingLouverDepth + 0.2)}m`,
              rationale: 'Deep exterior terra cotta louvers will eliminate glare on south-facing studio spaces without compromising natural lux.',
              impactMetric: '+8% Visual Comfort',
            },
          ],
        },
        {
          id: `eng-${Date.now()}`,
          agentId: 'engineer',
          roleName: 'Marcus Vance, PE, SE',
          roleTitle: 'Senior Structural & MEP Engineer',
          avatarIcon: 'Activity',
          status: metrics.structural.status === 'compliant' ? 'approved' : metrics.structural.status === 'warning' ? 'concern' : 'critical',
          headline: metrics.structural.status === 'compliant' ? 'Lateral Drift Well Within Code Limits' : 'Timber Flexibility Requires Braced Core',
          commentary: `Calculated wind shear deflection at ${metrics.buildingHeightM}m height is ${metrics.structural.maxDeflectionMm}mm against an allowable limit of ${metrics.structural.allowableDeflectionMm}mm (${metrics.structural.lateralDriftRatio}). Mass timber requires careful consideration of diaphragm stiffness.`,
          keyMetric: `${metrics.structural.lateralDriftRatio} Drift Ratio`,
          timestamp: Date.now(),
          suggestedTweaks: [
            {
              parameter: 'primaryStructure',
              currentVal: parameters.primaryStructure,
              suggestedVal: parameters.floors > 18 ? 'hybrid_timber_steel' : 'glulam_mass_timber',
              rationale: parameters.floors > 18 ? 'A hybrid steel outrigger core reinforces the mass timber framing above 18 storeys.' : 'Glulam post-and-beam satisfies all gravity and lateral criteria.',
              impactMetric: 'Structural Safety Factor: 2.1',
            },
          ],
        },
        {
          id: `con-${Date.now()}`,
          agentId: 'constructor',
          roleName: 'David Chen, CCM',
          roleTitle: 'Virtual Construction Manager',
          avatarIcon: 'Layers',
          status: 'approved',
          headline: 'High Prefabrication Readiness Index',
          commentary: `Off-site CNC machining of the CLT floor slabs and glulam girders enables just-in-time site assembly, shaving an estimated 14 weeks off conventional concrete superstructure schedule.`,
          keyMetric: '35% Faster Assembly',
          timestamp: Date.now(),
          suggestedTweaks: [
            {
              parameter: 'baySpacing',
              currentVal: `${parameters.baySpacing}m`,
              suggestedVal: '7.2m',
              rationale: 'Standardizing to 7.2m column bay spacing aligns perfectly with flatbed shipping constraints and crane picks.',
              impactMetric: '-12% Freight Carbon',
            },
          ],
        },
        {
          id: `eco-${Date.now()}`,
          agentId: 'ecologist',
          roleName: 'Dr. Soraya Morales',
          roleTitle: 'Regenerative Systems Ecologist',
          avatarIcon: 'Leaf',
          status: metrics.embodiedCarbon.rating === 'A' ? 'approved' : 'concern',
          headline: metrics.embodiedCarbon.rating === 'A' ? 'Exemplary Biogenic Carbon Sink' : 'Embodied Carbon Nearing Threshold',
          commentary: `Whole-life carbon is calculated at ${metrics.embodiedCarbon.perSqMeter} kgCO2e/m², sequestering ${(metrics.embodiedCarbon.biogenicCarbonStoredKg / 1000).toFixed(0)} metric tonnes of biogenic atmospheric carbon in the structural timber frame.`,
          keyMetric: `${metrics.embodiedCarbon.perSqMeter} kgCO2e/m²`,
          timestamp: Date.now(),
          suggestedTweaks: [
            {
              parameter: 'insulationType',
              currentVal: parameters.insulationType,
              suggestedVal: 'mycelium_bio_composite',
              rationale: 'Specifying mycelium acoustic and thermal composite eliminates petroleum-derived foams and sequesters carbon.',
              impactMetric: '-18 kgCO2e/m² GWP',
            },
          ],
        },
      ];

      for (const turn of fallbackCouncil) {
        sendEvent('agent_turn', turn);
        await new Promise((r) => setTimeout(r, 300));
      }
      sendEvent('complete', { success: true, count: fallbackCouncil.length });
      res.end();
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    const agentIcons: Record<string, string> = {
      architect: 'Compass',
      engineer: 'Activity',
      constructor: 'Layers',
      ecologist: 'Leaf',
    };

    const turns: AgentDebateTurn[] = parsed.map((item: any, idx: number) => ({
      id: `${item.agentId}-${Date.now()}-${idx}`,
      agentId: item.agentId,
      roleName: item.roleName,
      roleTitle: item.roleTitle || 'Disciplinary Specialist',
      avatarIcon: agentIcons[item.agentId] || 'Cpu',
      status: item.status || 'approved',
      headline: item.headline || 'Design Analysis',
      commentary: item.commentary || 'Analysis complete.',
      keyMetric: item.keyMetric || 'Verified',
      suggestedTweaks: item.suggestedTweaks || [],
      timestamp: Date.now(),
    }));

    for (const turn of turns) {
      sendEvent('agent_turn', turn);
      await new Promise((r) => setTimeout(r, 200));
    }
    sendEvent('complete', { success: true, count: turns.length });
    res.end();
  } catch (err: any) {
    console.error('Agent deliberation error:', err);
    sendEvent('error', { message: err.message || 'Agent deliberation failed' });
    res.end();
  }
});

// Single-Agent Role-Based Consultation Dialog
app.post('/api/agents/consult', async (req: Request, res: Response) => {
  const { agentId, question, parameters, metrics } = req.body;

  const agentPersonas: Record<string, { name: string; role: string; systemPrompt: string }> = {
    architect: {
      name: 'Elena Rostova, AIA',
      role: 'Lead Design Architect',
      systemPrompt: 'You are Elena Rostova, a world-class regenerative architect mentoring students in the ACE Mentor Program. You focus on daylight autonomy, biophilic harmony, massing aesthetics, and human-scale urban connection. Answer directly, concisely, and educationally.',
    },
    engineer: {
      name: 'Marcus Vance, PE, SE',
      role: 'Senior Structural & MEP Engineer',
      systemPrompt: 'You are Marcus Vance, a licensed structural and building systems engineer. You focus on mass timber mechanics, lateral drift (H/400), wind shear, seismic resilience, and HVAC heat-pump efficiency. Ground your answers in practical engineering formulas and building codes.',
    },
    constructor: {
      name: 'David Chen, CCM',
      role: 'Virtual Construction Manager',
      systemPrompt: 'You are David Chen, a construction superintendent specializing in modular prefabrication, VDC (Virtual Design & Construction), 4D scheduling, crane logistics, and jobsite safety. Provide pragmatic constructability advice.',
    },
    ecologist: {
      name: 'Dr. Soraya Morales',
      role: 'Regenerative Systems Ecologist',
      systemPrompt: 'You are Dr. Soraya Morales, an urban ecologist and circular economy specialist. You evaluate whole-life carbon (EC3 schema), biogenic storage, local zoning climate regulations (like Boston BERDO 2.0 / Stretch Code), urban heat island effect, and stormwater ecology.',
    },
  };

  const persona = agentPersonas[agentId] || agentPersonas.architect;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        agentId,
        agentName: persona.name,
        role: persona.role,
        reply: `As ${persona.name} (${persona.role}), reviewing your ${parameters.floors}-floor ${parameters.typology.replace(/_/g, ' ')}: your current parameters yield ${metrics.embodiedCarbon.perSqMeter} kgCO2e/m² embodied carbon and ${metrics.daylight.sda300_50}% daylight autonomy. Addressing your question "${question}": I recommend prioritizing mass timber cross-bracing and deep louvers to preserve comfort while hitting net-zero targets.`,
      });
    }

    const prompt = `
System Context: ${persona.systemPrompt}
Current Building Parameters:
- Typology: ${parameters.typology}
- Floors: ${parameters.floors} (${metrics.buildingHeightM}m)
- Area: ${metrics.grossFloorAreaSqM} m²
- Structure: ${parameters.primaryStructure}
- Window-to-Wall: ${(parameters.windowToWallRatio * 100).toFixed(0)}%
- Shading Louvers: ${parameters.shadingLouverDepth}m
- Carbon: ${metrics.embodiedCarbon.perSqMeter} kgCO2e/m²
- Deflection: ${metrics.structural.maxDeflectionMm}mm (${metrics.structural.lateralDriftRatio})

Student Question:
"${question}"

Provide a direct, inspiring, and technically grounded response (1-2 paragraphs, max 150 words) that teaches the student the underlying architectural/engineering principle.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      agentId,
      agentName: persona.name,
      role: persona.role,
      reply: response.text?.trim() || 'No response generated.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Consultation failed' });
  }
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Symbiocen server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
