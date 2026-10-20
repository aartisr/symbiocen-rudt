import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuildingParameters, ShaderMode, SimulationMetrics } from '../../types';
import { disposeObject3D } from '../../viewport/disposeObject3D';
import {
  Sun,
  Layers,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Play,
  Pause,
  Clock,
  Wind,
  Moon,
  FastForward,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

export interface SolarCoordinates {
  hour: number;
  altitudeDeg: number;
  azimuthDeg: number;
  isDaytime: boolean;
  shadowLengthRatio: number;
  sunPosition: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  bgHex: number;
  timeStr: string;
  phase: string;
}

export function computeSolarCoordinates(hour: number): SolarCoordinates {
  const normHour = ((hour % 24) + 24) % 24;
  const h = Math.floor(normHour);
  const m = Math.floor((normHour - h) * 60);
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const timeStr = `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;

  // Solar hour angle: -180° (midnight) to 0° (noon) to +180° (midnight)
  const H = (normHour - 12) * 15 * (Math.PI / 180);
  // ACE site latitude (Boston ~42.36° N) and declination (~20° for summer design conditions)
  const lat = 42.36 * (Math.PI / 180);
  const dec = 20.0 * (Math.PI / 180);

  // Solar Altitude angle: sin(alt) = sin(lat)*sin(dec) + cos(lat)*cos(dec)*cos(H)
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altRad * (180 / Math.PI);

  // Solar Azimuth: angle measured from North (0° = North, 90° = East, 180° = South, 270° = West)
  const cosAz =
    (Math.sin(altRad) * Math.sin(lat) - Math.sin(dec)) /
    (Math.max(0.001, Math.cos(altRad)) * Math.cos(lat));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  let azRad = Math.acos(clampedCosAz);
  if (H > 0) {
    azRad = 2 * Math.PI - azRad; // afternoon: West side
  }
  const azDeg = (azRad * (180 / Math.PI)) % 360;

  const isDaytime = altDeg > 0;

  // Phase naming
  let phase = 'Night';
  if (normHour >= 4.5 && normHour < 6.0) phase = 'Astronomical Dawn';
  else if (normHour >= 6.0 && normHour < 7.5) phase = 'Sunrise & Dawn';
  else if (normHour >= 7.5 && normHour < 11.0) phase = 'Morning Sun';
  else if (normHour >= 11.0 && normHour < 13.5) phase = 'Solar Noon Peak';
  else if (normHour >= 13.5 && normHour < 17.0) phase = 'Afternoon Exposure';
  else if (normHour >= 17.0 && normHour < 19.5) phase = 'Golden Hour / Sunset';
  else if (normHour >= 19.5 && normHour < 21.0) phase = 'Civil Dusk';
  else phase = 'Nocturnal Cycle';

  const radius = 95;
  const sunPos = new THREE.Vector3();
  const sunColor = new THREE.Color();
  const hemiSky = new THREE.Color();
  const hemiGround = new THREE.Color();
  let sunIntensity = 2.2;
  let hemiIntensity = 0.85;
  let bgHex = 0x0a0e17;

  // Shadow length ratio = cot(alt) = 1 / tan(alt)
  let shadowLengthRatio = 1.0;

  if (isDaytime) {
    const clampedAltRad = Math.max(0.05, altRad);
    shadowLengthRatio = Math.min(12, 1 / Math.tan(clampedAltRad));

    const y = Math.max(5, radius * Math.sin(clampedAltRad));
    const horizDist = radius * Math.cos(clampedAltRad);
    // In Three.js coordinates: +X is East, -X is West, -Z is North, +Z is South
    // azDeg: 0° is North (-Z), 90° is East (+X), 180° is South (+Z), 270° is West (-X)
    const x = horizDist * Math.sin(azRad);
    const z = -horizDist * Math.cos(azRad);
    sunPos.set(x, y, z);

    // Color temperature & intensity transition based on altitude
    if (altDeg < 12) {
      // Golden hour / sunrise / sunset
      const t = altDeg / 12;
      sunColor.lerpColors(new THREE.Color(0xff6e26), new THREE.Color(0xffb74d), t);
      sunIntensity = 0.9 + t * 1.0;
      hemiSky.setHex(0xffa26b);
      hemiGround.setHex(0x1e1520);
      hemiIntensity = 0.65;
      bgHex = 0x14101d;
    } else if (altDeg < 30) {
      // Mid morning / late afternoon
      const t = (altDeg - 12) / 18;
      sunColor.lerpColors(new THREE.Color(0xffb74d), new THREE.Color(0xfffaec), t);
      sunIntensity = 1.9 + t * 0.4;
      hemiSky.setHex(0xd0e3f5);
      hemiGround.setHex(0x1a2333);
      hemiIntensity = 0.8;
      bgHex = 0x0a0f1d;
    } else {
      // Solar Noon high sun
      sunColor.setHex(0xffffff);
      sunIntensity = 2.4;
      hemiSky.setHex(0xd9e6f2);
      hemiGround.setHex(0x1a2333);
      hemiIntensity = 0.9;
      bgHex = 0x0a0e17;
    }
  } else {
    // Nocturnal / Moonlight simulation
    shadowLengthRatio = 3.5;
    // Position moon on opposite arc in nocturnal sky
    const moonAltRad = Math.max(0.2, -altRad * 0.7);
    const moonAzRad = (azRad + Math.PI) % (2 * Math.PI);
    const y = Math.max(15, radius * Math.sin(moonAltRad));
    const horizDist = radius * Math.cos(moonAltRad);
    const x = horizDist * Math.sin(moonAzRad);
    const z = -horizDist * Math.cos(moonAzRad);
    sunPos.set(x, y, z);

    sunColor.setHex(0x6e95c7); // Cool silvery moonlight
    sunIntensity = 0.38; // Soft nocturnal directional illumination casting visible building shadows
    hemiSky.setHex(0x1c2940);
    hemiGround.setHex(0x0a0f18);
    hemiIntensity = 0.35;
    bgHex = 0x05070e;
  }

  return {
    hour: normHour,
    altitudeDeg: altDeg,
    azimuthDeg: azDeg,
    isDaytime,
    shadowLengthRatio,
    sunPosition: sunPos,
    sunColor,
    sunIntensity,
    hemiSkyColor: hemiSky,
    hemiGroundColor: hemiGround,
    hemiIntensity,
    bgHex,
    timeStr,
    phase,
  };
}

export interface SunlightExposureAnalysis {
  score: number; // 0 - 100
  averageSolarHours: number; // e.g. 6.4 hrs/day
  rating: string; // e.g. 'Optimal Solar Autonomy'
  ratingTier: 'exceptional' | 'optimal' | 'balanced' | 'moderate' | 'low';
  louverCutoffPercent: number; // e.g. 28%
  directBeamInsolationKwh: number; // e.g. 4.2 kWh/m²/day
  solarApertureEfficiency: number; // 0 - 100%
  glareMitigationText: string;
  recommendation: string;
}

export function computeSunlightExposureScore(params: BuildingParameters): SunlightExposureAnalysis {
  const {
    typology,
    floors,
    footprintWidth,
    footprintDepth,
    orientationAzimuth,
    shadingLouverDepth,
    windowToWallRatio,
  } = params;

  // 1. Orientation Solar Factor (South = 180° in Northern Hemisphere, e.g. Boston Lat 42.4°N)
  // Angular offset from True South (180°)
  const angleDelta = Math.abs(((orientationAzimuth - 180 + 540) % 360) - 180);
  const orientationRad = (angleDelta * Math.PI) / 180;
  // South-facing direct aperture capture factor: 1.0 at 180° (South), 0.0 at 0° (North), 0.5 at East/West
  const southFactor = (Math.cos(orientationRad) + 1) / 2;

  // Massing aspect ratio: elongation along EW axis captures more solar insolation
  const aspect = Math.max(0.6, Math.min(2.5, footprintWidth / Math.max(1, footprintDepth)));
  const apertureEfficiency = Math.round(
    Math.min(100, Math.max(10, (southFactor * 0.72 + (aspect > 1 ? 0.16 : 0.06) + 0.12) * 100))
  );

  // 2. Vertical Height & Urban Canyon Factor
  // Higher floors escape context shadowing and receive higher sky view factors
  const heightBonus = Math.min(1.6, Math.max(-0.8, (floors - 6) * 0.08));

  // 3. Typology Self-Shading & Geometry Modifiers
  let typologyHoursOffset = 0;
  let typologyScoreBonus = 0;
  if (typology === 'stepped_terrace') {
    typologyHoursOffset = 0.55; // Setbacks dramatically increase sky exposure for terraces
    typologyScoreBonus = 6;
  } else if (typology === 'biophilic_podium') {
    typologyHoursOffset = 0.25; // Broad podium captures unshaded zenith sun
    typologyScoreBonus = 3;
  } else if (typology === 'courtyard_metabolism') {
    typologyHoursOffset = -0.45; // Deep atrium canyon causes self-shading on lower internal perimeter
    typologyScoreBonus = -2;
  } else {
    // mass_timber_tower
    typologyHoursOffset = 0.15;
    typologyScoreBonus = 2;
  }

  // 4. Shading Louver Attenuation (0.0m to 1.2m)
  // Louvers shield high-angle summer direct sun (reducing glare/overheating) while retaining useful daylight.
  const louverDepthClamped = Math.max(0, Math.min(1.2, shadingLouverDepth));
  const louverCutoffPercent = Math.round((louverDepthClamped / 1.2) * 38); // up to 38% direct solar cutoff
  const louverHoursFactor = 1.0 - (louverCutoffPercent / 100) * 0.35; // direct solar hours attenuated

  // 5. Calculate Average Solar Hours (hrs/day)
  // Baseline clear-sky equinox daylight potential: ~7.4 hrs
  const baseDaylightHours = 7.4;
  let rawSolarHours =
    (baseDaylightHours + heightBonus + typologyHoursOffset) *
    (0.65 + 0.35 * southFactor) *
    louverHoursFactor;
  // Window-to-wall factor slightly modifies internal solar admission
  rawSolarHours = rawSolarHours * (0.85 + windowToWallRatio * 0.25);
  const averageSolarHours = Math.round(Math.max(2.4, Math.min(9.8, rawSolarHours)) * 10) / 10;

  // 6. Calculate Bioclimatic Sunlight Exposure Score (0 - 100)
  // Evaluates daylight autonomy balance against overheating/glare
  let baseScore = 50;

  // Solar hours contribution (ideal 5.8 - 7.8 hrs/day)
  if (averageSolarHours >= 5.8 && averageSolarHours <= 7.8) {
    baseScore += 30;
  } else if (averageSolarHours >= 4.8 && averageSolarHours <= 8.5) {
    baseScore += 22;
  } else if (averageSolarHours >= 3.8) {
    baseScore += 14;
  } else {
    baseScore += 5;
  }

  // Orientation contribution (up to 15 pts)
  baseScore += Math.round(southFactor * 14);

  // Louver optimization score:
  // 0.0m louver causes high glare risk (+1 pt)
  // 0.3m - 0.8m is the sweet spot for bioclimatic passive design (+12 pts)
  // > 0.8m is slightly over-shaded (+8 pts)
  if (louverDepthClamped >= 0.3 && louverDepthClamped <= 0.8) {
    baseScore += 12;
  } else if (louverDepthClamped > 0.8) {
    baseScore += 8;
  } else if (louverDepthClamped > 0.0) {
    baseScore += 6;
  } else {
    baseScore += 1; // unshaded direct glare risk
  }

  baseScore += typologyScoreBonus;

  const score = Math.max(25, Math.min(99, Math.round(baseScore)));

  // Rating Tier
  let rating = 'Balanced Exposure';
  let ratingTier: 'exceptional' | 'optimal' | 'balanced' | 'moderate' | 'low' = 'balanced';
  if (score >= 88) {
    rating = 'Exceptional Bioclimatic';
    ratingTier = 'exceptional';
  } else if (score >= 76) {
    rating = 'Optimal Solar Autonomy';
    ratingTier = 'optimal';
  } else if (score >= 62) {
    rating = 'Balanced Exposure';
    ratingTier = 'balanced';
  } else if (score >= 48) {
    rating = 'Moderate Daylight';
    ratingTier = 'moderate';
  } else {
    rating = 'Sub-Optimal / Over-Shaded';
    ratingTier = 'low';
  }

  // Direct Beam Insolation (kWh/m²/day)
  const directBeamInsolationKwh =
    Math.round(averageSolarHours * 0.62 * (1 - louverCutoffPercent * 0.003) * 10) / 10;

  // Glare mitigation diagnosis
  let glareMitigationText = 'Balanced Glare Control';
  if (louverDepthClamped === 0) {
    glareMitigationText = 'High Glare Risk (No Louvers)';
  } else if (louverDepthClamped <= 0.3) {
    glareMitigationText = 'Moderate Glare Protection';
  } else if (louverDepthClamped <= 0.8) {
    glareMitigationText = 'Optimized Cutoff (LEED v4 Compliant)';
  } else {
    glareMitigationText = 'Deep Shading (Minimal Glare)';
  }

  // Recommendation
  let recommendation = 'Current massing and orientation achieve balanced solar access.';
  if (angleDelta > 80) {
    recommendation = 'Rotate massing toward South (165°–195°) to enhance daylight autonomy.';
  } else if (louverDepthClamped === 0 && windowToWallRatio > 0.5) {
    recommendation = 'Add 0.4m–0.6m louvers to mitigate direct solar glare on South facades.';
  } else if (louverDepthClamped > 0.9 && averageSolarHours < 5.0) {
    recommendation = 'Reduce louver depth to allow deeper passive winter solar daylight penetration.';
  } else if (typology === 'courtyard_metabolism') {
    recommendation = 'Stepped terraces on North courtyard edge could improve lower-level daylight.';
  }

  return {
    score,
    averageSolarHours,
    rating,
    ratingTier,
    louverCutoffPercent,
    directBeamInsolationKwh,
    solarApertureEfficiency: apertureEfficiency,
    glareMitigationText,
    recommendation,
  };
}

interface ThreeDigitalTwinProps {
  parameters: BuildingParameters;
  metrics: SimulationMetrics;
  onParameterChange: <Key extends keyof BuildingParameters>(key: Key, value: BuildingParameters[Key]) => void;
  shaderMode: ShaderMode;
  onShaderModeChange: (mode: ShaderMode) => void;
}

const ThreeDigitalTwinComponent: React.FC<ThreeDigitalTwinProps> = ({
  parameters,
  metrics,
  onParameterChange,
  shaderMode,
  onShaderModeChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [controlsCollapsed, setControlsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 24-Hour Solar Cycle & Dynamic Shadow Scrubbing State
  const [timeOfDay, setTimeOfDay] = useState<number>(13.5); // 13.5 = 1:30 PM
  const timeOfDayRef = useRef<number>(13.5);
  timeOfDayRef.current = timeOfDay;

  const [isSolarAnimating, setIsSolarAnimating] = useState(false);
  const isSolarAnimatingRef = useRef(false);
  isSolarAnimatingRef.current = isSolarAnimating;

  const [solarSpeed, setSolarSpeed] = useState<number>(1); // 1x, 2x, 4x
  const solarSpeedRef = useRef<number>(1);
  solarSpeedRef.current = solarSpeed;

  const lastTimeSyncRef = useRef<number>(0);

  // Derived current solar coordinates for reactive UI HUD and controls
  const currentSolar = useMemo(() => computeSolarCoordinates(timeOfDay), [timeOfDay]);

  // Dynamic Sunlight Exposure Score & Bioclimatic Analysis
  const [showSolarDetails, setShowSolarDetails] = useState(false);
  const exposureAnalysis = useMemo(() => computeSunlightExposureScore(parameters), [parameters]);

  // Wind Flow Vector Field Simulation State
  const [isWindOverlayActive, setIsWindOverlayActive] = useState(false);
  const isWindOverlayActiveRef = useRef(false);
  isWindOverlayActiveRef.current = isWindOverlayActive;
  const [windSpeedMs, setWindSpeedMs] = useState(12.5); // m/s
  const windSpeedMsRef = useRef(12.5);
  windSpeedMsRef.current = windSpeedMs;
  const windGroupRef = useRef<THREE.Group | null>(null);

  // Mutable refs for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Store latest params in ref for access in animation loop
  const paramsRef = useRef(parameters);
  paramsRef.current = parameters;

  const shaderModeRef = useRef(shaderMode);
  shaderModeRef.current = shaderMode;

  // Initialize WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.007);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(65, 45, 75);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't dip below ground
    controls.minDistance = 15;
    controls.maxDistance = 250;
    controls.target.set(0, 15, 0);
    controlsRef.current = controls;

    // 5. Environment & Studio Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environmentTexture;
    pmremGenerator.dispose();

    // Key Light (Sun)
    const sunLight = new THREE.DirectionalLight(0xfff6e5, 2.2);
    sunLight.position.set(40, 70, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    const shadowD = 85;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Hemisphere Fill Light
    const hemiLight = new THREE.HemisphereLight(0xd9e6f2, 0x1a2333, 0.85);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // Subtle Rim Light
    const rimLight = new THREE.DirectionalLight(0x7399c6, 0.6);
    rimLight.position.set(-50, 40, -50);
    scene.add(rimLight);

    // 6. Ground Site Parcel
    const siteGroup = new THREE.Group();
    scene.add(siteGroup);

    // Urban plaza ground plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x161d2b,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    siteGroup.add(ground);

    // Site Grid lines (architectural parcel grid)
    const gridHelper = new THREE.GridHelper(160, 32, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.02;
    siteGroup.add(gridHelper);

    // Surrounding context placeholder masses (Boston/Flint urban block footprints)
    const contextMat = new THREE.MeshStandardMaterial({
      color: 0x182234,
      roughness: 0.9,
      transparent: true,
      opacity: 0.65,
    });

    const addContextBuilding = (x: number, z: number, w: number, d: number, h: number) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, contextMat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      siteGroup.add(mesh);
    };

    addContextBuilding(-50, -35, 26, 32, 28);
    addContextBuilding(52, -30, 24, 28, 36);
    addContextBuilding(-45, 45, 30, 24, 22);
    addContextBuilding(48, 48, 28, 30, 20);

    // Building Group Container
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // 7. Wind Flow Vector Field System & Aerodynamic Pressure Gradients
    const windGroup = new THREE.Group();
    windGroup.visible = false;
    scene.add(windGroup);
    windGroupRef.current = windGroup;

    const WIND_PARTICLE_COUNT = 340;
    const windGeo = new THREE.ConeGeometry(0.32, 1.85, 5);
    windGeo.rotateX(Math.PI / 2); // Directional arrow pointing forward along +Z

    const windMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    const windInstancedMesh = new THREE.InstancedMesh(windGeo, windMat, WIND_PARTICLE_COUNT);
    windInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    windInstancedMesh.frustumCulled = false;
    windGroup.add(windInstancedMesh);

    // Windward Stagnation Gradient Indicator Plane (+Cp High Pressure)
    const windwardPlaneGeo = new THREE.PlaneGeometry(1, 1);
    const windwardPlaneMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const windwardPlane = new THREE.Mesh(windwardPlaneGeo, windwardPlaneMat);
    windGroup.add(windwardPlane);

    // Leeward Suction Cavity Gradient Plane (-Cp Wake Depression)
    const leewardPlaneGeo = new THREE.PlaneGeometry(1, 1);
    const leewardPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const leewardPlane = new THREE.Mesh(leewardPlaneGeo, leewardPlaneMat);
    windGroup.add(leewardPlane);

    // Particle state buffers
    const particlePositions = new Float32Array(WIND_PARTICLE_COUNT * 3);

    // Reusable math objects to ensure zero GC in animation loop
    const _dummy = new THREE.Object3D();
    const _color = new THREE.Color();
    const _unitZ = new THREE.Vector3(0, 0, 1);
    const _dir = new THREE.Vector3();

    // Distribute particles across windward upstream atmospheric volume
    for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 110;
      particlePositions[i3 + 1] = 1.0 + Math.random() * 65;
      particlePositions[i3 + 2] = -80 + Math.random() * 155;
    }

    // Animation Render Loop
    const timer = new THREE.Timer();
    timer.connect(document);
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      timer.update();
      const delta = timer.getDelta();

      // Smoothly update controls
      controls.update();

      // Dynamically orient building massing according to site orientation azimuth
      if (buildingGroupRef.current) {
        buildingGroupRef.current.rotation.y = (-paramsRef.current.orientationAzimuth * Math.PI) / 180;
      }

      // Update sun direction and dynamic shadow movement across building and context
      if (isSolarAnimatingRef.current) {
        // Advance 24-hour cycle (e.g. 1x speed is ~20 seconds for full 24h)
        const hourStep = delta * 1.2 * solarSpeedRef.current;
        timeOfDayRef.current = (timeOfDayRef.current + hourStep) % 24;

        // Throttled UI sync to React state (~20 fps) for smooth slider & readout movement
        const now = performance.now();
        if (now - lastTimeSyncRef.current > 48) {
          lastTimeSyncRef.current = now;
          setTimeOfDay(timeOfDayRef.current);
        }
      }

      // Compute precise celestial position, atmospheric color temperature, and shadow projection
      const solar = computeSolarCoordinates(timeOfDayRef.current);

      if (sunLightRef.current) {
        sunLightRef.current.position.copy(solar.sunPosition);
        sunLightRef.current.color.copy(solar.sunColor);
        sunLightRef.current.intensity = solar.sunIntensity;
      }

      if (hemiLightRef.current) {
        hemiLightRef.current.color.copy(solar.hemiSkyColor);
        hemiLightRef.current.groundColor.copy(solar.hemiGroundColor);
        hemiLightRef.current.intensity = solar.hemiIntensity;
      }

      if (sceneRef.current) {
        if (sceneRef.current.background instanceof THREE.Color) {
          sceneRef.current.background.setHex(solar.bgHex);
        }
        if (sceneRef.current.fog) {
          sceneRef.current.fog.color.setHex(solar.bgHex);
        }
      }

      // Update Wind Flow Vector Field & Pressure Gradients
      if (isWindOverlayActiveRef.current && windGroupRef.current) {
        windGroupRef.current.visible = true;

        const currentParams = paramsRef.current;
        const bW = currentParams.footprintWidth;
        const bD = currentParams.footprintDepth;
        const bH = currentParams.floors * currentParams.floorHeight;
        const baseSpeed = windSpeedMsRef.current;

        // Position & scale facade pressure gradient indicator planes
        windwardPlane.scale.set(bW * 0.98, bH * 0.98, 1);
        windwardPlane.position.set(0, bH / 2 + 1.2, -bD / 2 - 0.2);

        leewardPlane.scale.set(bW * 0.98, bH * 0.98, 1);
        leewardPlane.position.set(0, bH / 2 + 1.2, bD / 2 + 0.2);

        const halfW = bW / 2 + 1.2;
        const halfD = bD / 2 + 1.2;

        for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          let px = particlePositions[i3];
          let py = particlePositions[i3 + 1];
          let pz = particlePositions[i3 + 2];

          let vx = 0;
          let vy = 0;
          let vz = baseSpeed;
          let pressureCp = 0.0;

          // 1. Upstream Stagnation Zone (in front of north windward facade)
          if (pz > -halfD - 24 && pz < -halfD && Math.abs(px) < halfW + 4 && py < bH + 4) {
            const distToFace = Math.max(0.1, -halfD - pz);
            const stagnationFactor = Math.min(1.0, 1.0 - distToFace / 24);
            vz = baseSpeed * Math.max(0.12, 1.0 - stagnationFactor * 0.88);
            pressureCp = stagnationFactor * 0.95; // Stagnation pressure coefficient Cp ~ +0.95

            // Deflect airflow laterally around flanks
            const signX = px >= 0 ? 1 : -1;
            vx = signX * (baseSpeed * stagnationFactor * 1.35);

            // Updraft over roof crest
            if (py > bH * 0.65) {
              vy = baseSpeed * 0.42 * stagnationFactor;
            }
          }
          // 2. Corner Acceleration & Lateral Bypass (Venturi effect)
          else if (pz >= -halfD && pz <= halfD && Math.abs(px) < halfW + 12) {
            const signX = px >= 0 ? 1 : -1;
            vz = baseSpeed * 1.48; // Accelerated bypass speed
            pressureCp = -0.35; // Local negative suction
            vx = signX * (baseSpeed * 0.22);
          }
          // 3. Leeward Recirculation Cavity (wake turbulence & negative suction)
          else if (pz > halfD && pz < halfD + 32 && Math.abs(px) < halfW + 8 && py < bH + 5) {
            vz = baseSpeed * 0.32;
            pressureCp = -0.58; // Wake suction pressure
            vx = Math.sin(delta * 4 + i) * 2.8;
            vy = Math.cos(delta * 3 + i) * 1.6;
          }
          // 4. Updraft over Roof Crown
          else if (py >= bH && py < bH + 16 && Math.abs(px) < halfW + 6 && pz > -halfD && pz < halfD) {
            vz = baseSpeed * 1.25;
            vy = Math.sin((pz / bD) * Math.PI) * 2.4;
            pressureCp = -0.25;
          }

          // Advance particle position
          px += vx * delta * 1.25;
          py += vy * delta * 1.25;
          pz += vz * delta * 1.25;

          // Recycle particle at upstream domain boundary
          if (pz > 75 || Math.abs(px) > 65 || py > 85 || py < 0.5) {
            px = (Math.random() - 0.5) * 110;
            py = 1.0 + Math.random() * (bH * 1.2);
            pz = -75 - Math.random() * 15;
          }

          particlePositions[i3] = px;
          particlePositions[i3 + 1] = py;
          particlePositions[i3 + 2] = pz;

          // Matrix update
          _dummy.position.set(px, py, pz);
          _dir.set(vx, vy, vz).normalize();
          _dummy.quaternion.setFromUnitVectors(_unitZ, _dir);
          _dummy.updateMatrix();
          windInstancedMesh.setMatrixAt(i, _dummy.matrix);

          // Color gradient based on pressure gradient and speed:
          if (pressureCp > 0.4) {
            _color.setHex(pressureCp > 0.75 ? 0xef4444 : 0xf59e0b); // Stagnation pressure
          } else if (vz > baseSpeed * 1.25) {
            _color.setHex(0x10b981); // Accelerated corner flow
          } else if (pressureCp < -0.35) {
            _color.setHex(0x8b5cf6); // Wake suction cavity
          } else {
            _color.setHex(0x38bdf8); // Free-stream wind
          }

          windInstancedMesh.setColorAt(i, _color);
        }

        windInstancedMesh.instanceMatrix.needsUpdate = true;
        if (windInstancedMesh.instanceColor) {
          windInstancedMesh.instanceColor.needsUpdate = true;
        }
      } else if (windGroupRef.current && windGroupRef.current.visible) {
        windGroupRef.current.visible = false;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      timer.dispose();
      controls.dispose();
      disposeObject3D(scene);
      environmentTexture.dispose();
      pmremGenerator.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Procedural 3D Building Reconstruction whenever parameters or shaderMode change
  useEffect(() => {
    const buildingGroup = buildingGroupRef.current;
    if (!buildingGroup) return;

    disposeObject3D(buildingGroup);
    buildingGroup.clear();

    const {
      typology,
      floors,
      floorHeight,
      footprintWidth,
      footprintDepth,
      baySpacing,
      windowToWallRatio,
      shadingLouverDepth,
      primaryStructure,
      greenRoofCoverage,
      photovoltaicCoverage,
      explodedViewProgress,
    } = parameters;

    // Helper color palette based on Shader Mode
    const getFloorColor = (floorIdx: number, totalFloors: number) => {
      const normalizedHeight = floorIdx / Math.max(1, totalFloors - 1);

      if (shaderMode === 'solar') {
        // Solar insolation gradient: Blue (low) -> Yellow -> Red (high)
        const c = new THREE.Color();
        c.setHSL(0.6 - normalizedHeight * 0.55, 0.9, 0.55);
        return c;
      }
      if (shaderMode === 'stress') {
        // Structural lateral shear stress: Green (base) -> Amber -> Crimson (peak deflection)
        const c = new THREE.Color();
        const stressVal = Math.pow(normalizedHeight, 1.6);
        c.setHSL(0.33 - stressVal * 0.33, 0.95, 0.5);
        return c;
      }
      if (shaderMode === 'daylight') {
        // Daylight penetration isolines
        const c = new THREE.Color();
        c.setHSL(0.55 - normalizedHeight * 0.15, 0.85, 0.6);
        return c;
      }
      if (shaderMode === 'thermal') {
        // Thermal heat island dissipation
        const c = new THREE.Color();
        c.setHSL(0.75 - normalizedHeight * 0.45, 0.8, 0.5);
        return c;
      }

      // Default PBR Architectural Materials
      if (primaryStructure === 'glulam_mass_timber') {
        return new THREE.Color(0xb8864e); // Engineered warm honey timber
      }
      if (primaryStructure === 'hybrid_timber_steel') {
        return new THREE.Color(0x738290); // Slate steel
      }
      if (primaryStructure === 'low_carbon_concrete') {
        return new THREE.Color(0x9ca3af); // Pale architectural concrete
      }
      return new THREE.Color(0x64748b);
    };

    // 1. Concrete Foundation Plinth
    const plinthHeight = 1.2;
    const plinthGeo = new THREE.BoxGeometry(footprintWidth + 2, plinthHeight, footprintDepth + 2);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = plinthHeight / 2;
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = true;
    buildingGroup.add(plinthMesh);

    // 2. Central Structural Core (Elevator / Stairwell Shear Tower)
    const coreWidth = Math.max(6, footprintWidth * 0.22);
    const coreDepth = Math.max(6, footprintDepth * 0.22);
    const totalHeight = floors * floorHeight;
    const coreGeo = new THREE.BoxGeometry(coreWidth, totalHeight, coreDepth);
    const coreMat = new THREE.MeshStandardMaterial({
      color: shaderMode === 'stress' ? 0x10b981 : 0x475569,
      roughness: 0.6,
      metalness: 0.2,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = totalHeight / 2 + plinthHeight;
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    buildingGroup.add(coreMesh);

    // Shared materials
    const timberColMat = new THREE.MeshStandardMaterial({
      color: 0xbf884f,
      roughness: 0.45,
      metalness: 0.05,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: shaderMode === 'daylight' ? 0x38bdf8 : 0x93c5fd,
      transmission: shaderMode === 'pbr' ? 0.88 : 0.45,
      opacity: 0.75,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.52,
    });

    const louverMat = new THREE.MeshStandardMaterial({
      color: 0xc27847, // Terracotta baguette
      roughness: 0.7,
      metalness: 0.1,
    });

    const greenRoofMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Sedum vegetation
      roughness: 0.9,
      metalness: 0.0,
    });

    const solarPvMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Monocrystalline deep blue
      roughness: 0.25,
      metalness: 0.85,
    });

    // 3. Build each floor level
    for (let f = 0; f < floors; f++) {
      const floorGroup = new THREE.Group();

      // Exploded view vertical separation offset
      const explodeOffset = f * explodedViewProgress * 6.5;
      const floorBaseY = plinthHeight + f * floorHeight + explodeOffset;

      // Floor massing modulation based on typology
      let floorW = footprintWidth;
      let floorD = footprintDepth;

      if (typology === 'stepped_terrace' && f > floors * 0.4) {
        const step = (f - Math.floor(floors * 0.4)) / (floors * 0.6);
        floorW = Math.max(14, footprintWidth * (1 - step * 0.42));
        floorD = Math.max(14, footprintDepth * (1 - step * 0.42));
      } else if (typology === 'biophilic_podium' && f >= 3) {
        floorW = footprintWidth * 0.72;
        floorD = footprintDepth * 0.72;
      }

      const slabThickness = 0.35;
      const slabGeo = new THREE.BoxGeometry(floorW, slabThickness, floorD);
      const floorColor = getFloorColor(f, floors);

      const slabMat = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: 0.5,
        metalness: 0.1,
      });

      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = floorBaseY + slabThickness / 2;
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      floorGroup.add(slabMesh);

      // Floor columns (Glulam timber post-and-beam grid)
      const numBaysX = Math.max(2, Math.floor(floorW / baySpacing));
      const numBaysZ = Math.max(2, Math.floor(floorD / baySpacing));
      const stepX = floorW / numBaysX;
      const stepZ = floorD / numBaysZ;
      const colWidth = 0.45;
      const colHeight = floorHeight - slabThickness;

      const colGeo = new THREE.BoxGeometry(colWidth, colHeight, colWidth);
      const columnPositions: Array<[number, number]> = [];

      for (let ix = 0; ix <= numBaysX; ix++) {
        for (let iz = 0; iz <= numBaysZ; iz++) {
          const cx = -floorW / 2 + ix * stepX;
          const cz = -floorD / 2 + iz * stepZ;

          // Don't place columns inside central core
          if (Math.abs(cx) < coreWidth / 2 && Math.abs(cz) < coreDepth / 2) {
            continue;
          }

          columnPositions.push([cx, cz]);
        }
      }

      const columns = new THREE.InstancedMesh(colGeo, timberColMat, columnPositions.length);
      const columnTransform = new THREE.Object3D();
      columnPositions.forEach(([x, z], index) => {
        columnTransform.position.set(x, floorBaseY + slabThickness + colHeight / 2, z);
        columnTransform.updateMatrix();
        columns.setMatrixAt(index, columnTransform.matrix);
      });
      columns.castShadow = true;
      columns.instanceMatrix.needsUpdate = true;
      floorGroup.add(columns);

      // Facade Glazing Envelope panels
      const facadeHeight = floorHeight - slabThickness;
      const wallH = facadeHeight * windowToWallRatio;

      // North & South glass walls
      const glassWallGeoZ = new THREE.BoxGeometry(floorW - 0.2, wallH, 0.12);
      const southGlass = new THREE.Mesh(glassWallGeoZ, glassMat);
      southGlass.position.set(0, floorBaseY + slabThickness + wallH / 2, floorD / 2);
      floorGroup.add(southGlass);

      const northGlass = new THREE.Mesh(glassWallGeoZ, glassMat);
      northGlass.position.set(0, floorBaseY + slabThickness + wallH / 2, -floorD / 2);
      floorGroup.add(northGlass);

      // East & West glass walls
      const glassWallGeoX = new THREE.BoxGeometry(0.12, wallH, floorD - 0.2);
      const eastGlass = new THREE.Mesh(glassWallGeoX, glassMat);
      eastGlass.position.set(floorW / 2, floorBaseY + slabThickness + wallH / 2, 0);
      floorGroup.add(eastGlass);

      const westGlass = new THREE.Mesh(glassWallGeoX, glassMat);
      westGlass.position.set(-floorW / 2, floorBaseY + slabThickness + wallH / 2, 0);
      floorGroup.add(westGlass);

      // Exterior Shading Louvers on South Facade
      if (shadingLouverDepth > 0) {
        const louverCount = 3;
        const louverWidth = floorW * 0.96;
        const louverThickness = 0.08;
        const louverGeo = new THREE.BoxGeometry(louverWidth, louverThickness, shadingLouverDepth);

        for (let l = 0; l < louverCount; l++) {
          const ly = floorBaseY + slabThickness + (l + 1) * (facadeHeight / (louverCount + 1));
          const louverMesh = new THREE.Mesh(louverGeo, louverMat);
          louverMesh.position.set(0, ly, floorD / 2 + shadingLouverDepth / 2 + 0.05);
          louverMesh.castShadow = true;
          floorGroup.add(louverMesh);
        }
      }

      buildingGroup.add(floorGroup);
    }

    // 4. Roof Crown: Biophilic Garden & Solar PV Array
    const roofY = plinthHeight + floors * floorHeight + floors * explodedViewProgress * 6.5;
    const topFloorW =
      typology === 'stepped_terrace'
        ? Math.max(14, footprintWidth * 0.58)
        : typology === 'biophilic_podium'
        ? footprintWidth * 0.72
        : footprintWidth;
    const topFloorD =
      typology === 'stepped_terrace'
        ? Math.max(14, footprintDepth * 0.58)
        : typology === 'biophilic_podium'
        ? footprintDepth * 0.72
        : footprintDepth;

    if (greenRoofCoverage > 0) {
      const greenW = topFloorW * Math.min(0.9, greenRoofCoverage / 100);
      const greenD = topFloorD * 0.88;
      const greenGeo = new THREE.BoxGeometry(greenW, 0.45, greenD);
      const greenMesh = new THREE.Mesh(greenGeo, greenRoofMat);
      greenMesh.position.set(-topFloorW * 0.1, roofY + 0.25, 0);
      greenMesh.castShadow = true;
      greenMesh.receiveShadow = true;
      buildingGroup.add(greenMesh);
    }

    if (photovoltaicCoverage > 0) {
      const pvW = topFloorW * (photovoltaicCoverage / 100) * 0.75;
      const pvD = topFloorD * 0.7;
      const pvGeo = new THREE.BoxGeometry(pvW, 0.08, pvD);
      const pvMesh = new THREE.Mesh(pvGeo, solarPvMat);
      pvMesh.position.set(topFloorW * 0.15, roofY + 1.2, 0);
      pvMesh.rotation.x = 0.15; // 15-degree solar tilt
      pvMesh.castShadow = true;
      buildingGroup.add(pvMesh);
    }

    // Orient building massing according to orientationAzimuth relative to True North
    buildingGroup.rotation.y = (-parameters.orientationAzimuth * Math.PI) / 180;
  }, [
    parameters.typology,
    parameters.floors,
    parameters.floorHeight,
    parameters.footprintWidth,
    parameters.footprintDepth,
    parameters.baySpacing,
    parameters.windowToWallRatio,
    parameters.shadingLouverDepth,
    parameters.primaryStructure,
    parameters.greenRoofCoverage,
    parameters.photovoltaicCoverage,
    parameters.explodedViewProgress,
    shaderMode,
  ]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(65, 45, 75);
    controlsRef.current.target.set(0, 15, 0);
    controlsRef.current.update();
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 overflow-hidden bg-[#0A0E17] flex flex-col"
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top Left Spec HUD & Sunlight Exposure Score Badge */}
      <div className="absolute top-4 left-4 z-10 hidden lg:flex flex-col gap-2 max-w-[calc(100vw-360px)]">
        {/* Main Spec Pill */}
        <div className="flex items-center flex-wrap gap-2 px-3 py-1.5 rounded-lg bg-[#0B0F17]/85 backdrop-blur-md border border-slate-800 text-xs text-slate-300 pointer-events-none select-none shadow-lg">
          <span className="font-semibold text-white tracking-wide">
            {parameters.typology === 'mass_timber_tower' && 'Mass Timber Tower'}
            {parameters.typology === 'biophilic_podium' && 'Biophilic Podium'}
            {parameters.typology === 'courtyard_metabolism' && 'Courtyard Metabolism'}
            {parameters.typology === 'stepped_terrace' && 'Stepped Biophilic Terraces'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="font-mono tabular-nums">{parameters.floors} Floors</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono tabular-nums">{metrics.buildingHeightM}m Height</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono tabular-nums">{metrics.grossFloorAreaSqM.toLocaleString()} m² GFA</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono tabular-nums text-amber-400 font-semibold flex items-center gap-1.5">
            {currentSolar.isDaytime ? (
              <Sun className="w-3 h-3 text-amber-400" />
            ) : (
              <Moon className="w-3 h-3 text-indigo-300" />
            )}
            <span>{currentSolar.timeStr}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
              {currentSolar.phase}
            </span>
          </span>
          {isWindOverlayActive && (
            <>
              <span className="text-slate-500">·</span>
              <span className="font-mono tabular-nums text-sky-400 font-semibold flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-400" />
                {windSpeedMs.toFixed(1)} m/s ({(0.5 * 1.225 * Math.pow(windSpeedMs, 2) / 1000).toFixed(2)} kPa)
              </span>
            </>
          )}
        </div>

        {/* Sunlight Exposure Score Interactive Badge */}
        <div className="relative pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowSolarDetails((prev) => !prev)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs transition-all shadow-lg active:scale-95 text-left cursor-pointer ${
              showSolarDetails
                ? 'bg-amber-950/90 border-amber-400 text-white shadow-amber-950/40'
                : 'bg-[#0B0F17]/90 hover:bg-[#131B2B] border-amber-500/35 hover:border-amber-400/70 text-slate-200'
            }`}
            title="Click to toggle Sunlight Exposure Score bioclimatic diagnostics and parameter breakdown"
          >
            {/* Solar Ring Icon */}
            <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
            </div>

            {/* Badge Title & Live Score */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-300 tracking-tight">Sunlight Exposure Score</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-sm font-extrabold text-white tabular-nums">
                  {exposureAnalysis.score}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">/100</span>
              </div>
              <span className="text-slate-500">·</span>
              {/* Average Solar Hours */}
              <span className="font-mono text-xs font-semibold text-amber-200 tabular-nums flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {exposureAnalysis.averageSolarHours.toFixed(1)} hrs/day avg
              </span>
              <span className="text-slate-500">·</span>
              {/* Rating Pill */}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  exposureAnalysis.ratingTier === 'exceptional'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : exposureAnalysis.ratingTier === 'optimal'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : exposureAnalysis.ratingTier === 'balanced'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {exposureAnalysis.rating}
              </span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ml-1 ${
                showSolarDetails ? 'rotate-180 text-amber-300' : ''
              }`}
            />
          </button>

          {/* Expanded Diagnostics Flyout Card */}
          {showSolarDetails && (
            <div className="absolute top-full left-0 mt-1.5 w-96 p-3.5 rounded-xl bg-[#0B0F17]/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Bioclimatic Solar Diagnostics
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSolarDetails(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Score Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium">Composite Exposure Rating</span>
                  <span className="font-mono font-bold text-white">{exposureAnalysis.score} / 100</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${exposureAnalysis.score}%` }}
                  />
                </div>
              </div>

              {/* Parametric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Average Solar Hours</div>
                  <div className="font-mono text-sm font-bold text-amber-300 mt-0.5">
                    {exposureAnalysis.averageSolarHours.toFixed(1)}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">hrs/day</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Benchmark: 5.5–7.5 hrs</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Solar Aperture Efficiency</div>
                  <div className="font-mono text-sm font-bold text-sky-300 mt-0.5">
                    {exposureAnalysis.solarApertureEfficiency}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Azimuth: {parameters.orientationAzimuth}°</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Louver Shading Cutoff</div>
                  <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                    {exposureAnalysis.louverCutoffPercent}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Depth: {parameters.shadingLouverDepth.toFixed(1)}m</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400">Direct Beam Insolation</div>
                  <div className="font-mono text-sm font-bold text-emerald-400 mt-0.5">
                    {exposureAnalysis.directBeamInsolationKwh}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">kWh/m²</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Daily clear-sky average</div>
                </div>
              </div>

              {/* Status & Recommendation */}
              <div className="space-y-1.5 text-[11px] bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{exposureAnalysis.glareMitigationText}</span>
                </div>
                <div className="text-slate-300 leading-relaxed font-sans">
                  {exposureAnalysis.recommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Right Viewport Quick Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Wind Flow Vector Field Toggle Button */}
        <button
          onClick={() => setIsWindOverlayActive((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-md active:scale-95 ${
            isWindOverlayActive
              ? 'bg-sky-600 hover:bg-sky-500 border-sky-400 text-white shadow-sky-900/30'
              : 'bg-[#0B0F17]/85 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isWindOverlayActive ? 'Disable Wind Flow Overlay' : 'Enable Wind Flow & Pressure Gradient Vector Field'}
          aria-label={isWindOverlayActive ? 'Disable wind flow overlay' : 'Enable wind flow overlay'}
        >
          <Wind className={`w-3.5 h-3.5 shrink-0 ${isWindOverlayActive ? 'text-white' : 'text-sky-400'}`} />
          <span className="hidden sm:inline whitespace-nowrap font-mono">
            {isWindOverlayActive ? `${windSpeedMs.toFixed(1)} m/s · Wind Flow` : 'Wind Vectors'}
          </span>
        </button>

        {/* Solar Shadow Simulation Toggle Button */}
        <button
          onClick={() => setIsSolarAnimating((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-md active:scale-95 ${
            isSolarAnimating
              ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white shadow-amber-900/30'
              : 'bg-[#0B0F17]/85 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isSolarAnimating ? 'Pause Solar Shadow Simulation' : 'Scrub or Play 24-Hour Solar Shadow Movement'}
          aria-label={isSolarAnimating ? 'Pause solar shadow simulation' : 'Play solar shadow simulation'}
        >
          {isSolarAnimating ? (
            <Pause className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="hidden sm:inline whitespace-nowrap font-mono">
            {isSolarAnimating ? `${currentSolar.timeStr} · Pause` : `${currentSolar.timeStr} · Sun Path`}
          </span>
        </button>

        <button
          onClick={handleResetCamera}
          className="p-2 rounded-lg bg-[#0B0F17]/85 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-[#0B0F17]/85 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ease-out">
        {/* Collapse / Expand Tab Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setControlsCollapsed(!controlsCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#0E1524]/90 hover:bg-[#162138] border-t border-x border-slate-800 text-xs font-medium text-slate-400 hover:text-white transition-colors shadow-lg"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>{controlsCollapsed ? 'Show Parametric Controls' : 'Hide Controls'}</span>
            {controlsCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Floating Dock Content */}
        {!controlsCollapsed && (
          <div className="max-h-72 overflow-y-auto p-3.5 rounded-xl bg-[#0E1524]/95 backdrop-blur-md border border-slate-800/80 shadow-2xl lg:max-h-none lg:overflow-visible">
            {/* Row 1: Shader Modes & Exploded View Slider */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
              {/* Shader Mode Selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-slate-400 mr-1.5 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" /> Mode:
                </span>
                {(
                  [
                    { id: 'pbr', label: 'Realistic PBR' },
                    { id: 'solar', label: 'Solar Insolation' },
                    { id: 'stress', label: 'Structural Stress' },
                    { id: 'daylight', label: 'Daylight Autonomy' },
                    { id: 'thermal', label: 'Thermal Loss' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onShaderModeChange(mode.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      shaderMode === mode.id
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Wind Flow Overlay Quick Toggle */}
                <button
                  type="button"
                  onClick={() => setIsWindOverlayActive((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                    isWindOverlayActive
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle 3D Wind Flow Vector Field and Facade Pressure Gradients"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Wind Vectors: {isWindOverlayActive ? 'ON' : 'OFF'}</span>
                </button>

                {/* Exploded View Slider */}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="whitespace-nowrap font-medium">Explode</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.explodedViewProgress}
                    onChange={(e) => onParameterChange('explodedViewProgress', parseFloat(e.target.value))}
                    className="w-20 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono tabular-nums text-slate-400 w-7">
                    {Math.round(parameters.explodedViewProgress * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Aerodynamic Wind Pressure & Velocity Control Strip */}
            {isWindOverlayActive && (
              <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 my-2 rounded-lg bg-sky-950/35 border border-sky-800/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center gap-1.5 text-sky-300 font-semibold text-[11px]">
                    <Wind className="w-3.5 h-3.5 text-sky-400" />
                    <span>Free-Stream (v∞):</span>
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="28"
                    step="0.5"
                    value={windSpeedMs}
                    onChange={(e) => setWindSpeedMs(parseFloat(e.target.value))}
                    className="w-24 accent-sky-400 cursor-pointer"
                  />
                  <span className="font-mono tabular-nums text-white font-semibold text-[11px]">
                    {windSpeedMs.toFixed(1)} m/s
                  </span>
                </div>

                {/* Pressure Coefficients & Dynamic Pressure */}
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-300">
                    <span className="text-slate-400">Peak Stagnation:</span>{' '}
                    <strong className="text-rose-400 font-bold tabular-nums">
                      +{(0.5 * 1.225 * Math.pow(windSpeedMs, 2) * 0.95 / 1000).toFixed(2)} kPa (+0.95 Cp)
                    </strong>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300">
                    <span className="text-slate-400">Leeward Wake:</span>{' '}
                    <strong className="text-purple-400 font-bold tabular-nums">
                      -{(0.5 * 1.225 * Math.pow(windSpeedMs, 2) * 0.58 / 1000).toFixed(2)} kPa (-0.58 Cp)
                    </strong>
                  </span>
                </div>

                {/* Gradient Legend */}
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Stagnation (+Cp)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bypass (1.45v∞)
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Free-Stream
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Wake Suction (-Cp)
                  </span>
                </div>
              </div>
            )}

            {/* 24-Hour Solar Cycle Temporal Scrubbing & Dynamic Shadow Analysis Bar */}
            <div className="p-3 my-2.5 rounded-lg bg-amber-950/25 border border-amber-500/30 text-xs shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
                {/* Time & Solar Phase Identification */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    {currentSolar.isDaytime ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white tabular-nums tracking-wide">
                        {currentSolar.timeStr}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentSolar.phase}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          currentSolar.isDaytime
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {currentSolar.isDaytime ? 'Daylight Insolation' : 'Nocturnal Sky'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>
                        Solar Alt: <strong className="text-slate-200">{currentSolar.altitudeDeg.toFixed(1)}°</strong>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span>
                        Azimuth: <strong className="text-slate-200">{currentSolar.azimuthDeg.toFixed(1)}°</strong>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span>
                        Shadow Extent:{' '}
                        <strong className="text-amber-400">{currentSolar.shadowLengthRatio.toFixed(2)}x</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Playback Controls & Speed Multipliers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSolarAnimating((p) => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
                      isSolarAnimating
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                    }`}
                    title={isSolarAnimating ? 'Pause Simulation' : 'Animate 24-Hour Diurnal Shadow Cycle'}
                  >
                    {isSolarAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isSolarAnimating ? 'Pause Cycle' : 'Simulate Shadows'}</span>
                  </button>

                  {/* Playback Speed Multiplier */}
                  <div className="flex items-center rounded-md bg-slate-900/90 border border-slate-800 p-0.5 text-[10px] font-mono">
                    <span className="text-slate-500 px-1.5 flex items-center gap-0.5">
                      <FastForward className="w-2.5 h-2.5" />
                    </span>
                    {[1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setSolarSpeed(spd)}
                        className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                          solarSpeed === spd
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={`${spd}x simulation speed`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* The Interactive 24-Hour Temporal Scrubber Slider */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.05"
                    value={timeOfDay}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTimeOfDay(val);
                      timeOfDayRef.current = val;
                    }}
                    className="w-full h-2.5 bg-gradient-to-r from-indigo-950 via-amber-400 to-indigo-950 rounded-lg appearance-none cursor-pointer accent-amber-400 shadow-inner"
                    title="Scrub 24-hour solar time to view dynamic shadow casting across building massing and context"
                  />
                </div>

                {/* Time Zone Indicators & Markers */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5 text-indigo-400" />
                    <span>00:00 Night</span>
                  </span>
                  <span>06:00 Dawn</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Sun className="w-2.5 h-2.5 text-amber-400" />
                    <span>12:00 Solar Noon</span>
                  </span>
                  <span>18:00 Sunset</span>
                  <span className="flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5 text-indigo-400" />
                    <span>24:00 Night</span>
                  </span>
                </div>
              </div>

              {/* Quick-Jump Diurnal Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Scrub Presets:
                </span>
                {[
                  { label: 'Dawn (6 AM)', time: 6.0 },
                  { label: 'Morning (9 AM)', time: 9.0 },
                  { label: 'Noon (12 PM)', time: 12.0 },
                  { label: 'Afternoon (3 PM)', time: 15.0 },
                  { label: 'Golden Hour (6 PM)', time: 18.0 },
                  { label: 'Dusk (8 PM)', time: 20.0 },
                  { label: 'Midnight (12 AM)', time: 0.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setTimeOfDay(preset.time);
                      timeOfDayRef.current = preset.time;
                    }}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                      Math.abs(timeOfDay - preset.time) < 0.35
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Sunlight Exposure Score Status Banner in Dock */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-2.5 rounded-lg bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/40 border border-amber-500/30 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-amber-300">Sunlight Exposure Score:</span>
                <span className="font-mono font-bold text-white text-sm">{exposureAnalysis.score}/100</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    exposureAnalysis.ratingTier === 'exceptional'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : exposureAnalysis.ratingTier === 'optimal'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : exposureAnalysis.ratingTier === 'balanced'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {exposureAnalysis.rating}
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-amber-200 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {exposureAnalysis.averageSolarHours.toFixed(1)} hrs/day avg
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>
                  Orientation: <strong className="text-slate-200">{parameters.orientationAzimuth}°</strong>
                </span>
                <span>·</span>
                <span>
                  Louvers:{' '}
                  <strong className="text-slate-200">
                    {parameters.shadingLouverDepth.toFixed(1)}m ({exposureAnalysis.louverCutoffPercent}%)
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Massing: <strong className="text-slate-200">{parameters.floors} Storeys</strong>
                </span>
              </div>
            </div>

            {/* Row 2: Live Parametric Massing Adjusters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
              {/* Floors */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Storeys</span>
                  <span className="font-mono tabular-nums text-white">{parameters.floors}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="28"
                  value={parameters.floors}
                  onChange={(e) => onParameterChange('floors', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Window-to-Wall Ratio */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Window-to-Wall</span>
                  <span className="font-mono tabular-nums text-white">
                    {Math.round(parameters.windowToWallRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.05"
                  value={parameters.windowToWallRatio}
                  onChange={(e) => onParameterChange('windowToWallRatio', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Shading Louver Depth */}
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Sun Louvers</span>
                  <span className="font-mono tabular-nums text-white">{parameters.shadingLouverDepth.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.2"
                  step="0.1"
                  value={parameters.shadingLouverDepth}
                  onChange={(e) => onParameterChange('shadingLouverDepth', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Site True North Orientation */}
              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Site Orientation</span>
                  </span>
                  <span className="font-mono tabular-nums text-white">{parameters.orientationAzimuth}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={parameters.orientationAzimuth}
                  onChange={(e) => onParameterChange('orientationAzimuth', parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                  title="Rotate building massing relative to site True North"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>North (0°)</span>
                  <span>South (180°)</span>
                  <span>North (360°)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ThreeDigitalTwin = memo(ThreeDigitalTwinComponent);
