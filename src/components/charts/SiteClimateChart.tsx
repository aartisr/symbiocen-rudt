import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  SiteClimateProfile,
  MonthlyClimatePoint,
  ClimateStrategyRecommendation,
  getClimateProfileForLocation,
} from '../../utils/climateData';
import {
  Thermometer,
  Sun,
  Wind,
  Flame,
  Snowflake,
  Sparkles,
  Check,
  Compass,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export type ChartMetricMode = 'temperature' | 'solar' | 'degree_days' | 'wind';

interface SiteClimateChartProps {
  siteLocation: string;
  onApplyStrategy?: (strategy: ClimateStrategyRecommendation) => void;
}

export const SiteClimateChart: React.FC<SiteClimateChartProps> = ({
  siteLocation,
  onApplyStrategy,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('temperature');
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyClimatePoint | null>(null);
  const [hasAppliedStrategy, setHasAppliedStrategy] = useState(false);

  const climateProfile = getClimateProfileForLocation(siteLocation);
  const data = climateProfile.monthlyData;
  const strategy = climateProfile.strategy;

  // Reset "applied" checkmark when site location changes
  useEffect(() => {
    setHasAppliedStrategy(false);
  }, [siteLocation]);

  // D3 Rendering Lifecycle
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 540;
    const height = 260;
    const margin = { top: 20, right: 28, bottom: 38, left: 46 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs for rich gradients
    const defs = svg.append('defs');

    // Temperature area gradient
    const tempGrad = defs
      .append('linearGradient')
      .attr('id', 'temp-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    tempGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f97316').attr('stop-opacity', 0.45);
    tempGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.15);

    // Solar area gradient
    const solarGrad = defs
      .append('linearGradient')
      .attr('id', 'solar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    solarGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.55);
    solarGrad.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.05);

    // Wind area gradient
    const windGrad = defs
      .append('linearGradient')
      .attr('id', 'wind-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    windGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.4);
    windGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.05);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Months)
    const xScale = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.35);

    // Y Scale depending on active mode
    let yScale: d3.ScaleLinear<number, number>;
    let yAxisFormatter: (d: d3.NumberValue) => string;

    if (metricMode === 'temperature') {
      const minTemp = Math.min(-10, d3.min(data, (d) => d.lowTempC) || -10);
      const maxTemp = Math.max(35, d3.max(data, (d) => d.highTempC) || 35);
      yScale = d3.scaleLinear().domain([minTemp - 2, maxTemp + 2]).range([innerHeight, 0]).nice();
      yAxisFormatter = (d) => `${d}°C`;
    } else if (metricMode === 'solar') {
      const maxSolar = Math.max(8, d3.max(data, (d) => d.solarGhiKwhM2Day) || 8);
      yScale = d3.scaleLinear().domain([0, maxSolar * 1.15]).range([innerHeight, 0]).nice();
      yAxisFormatter = (d) => `${d}`;
    } else if (metricMode === 'degree_days') {
      const maxDd = Math.max(800, d3.max(data, (d) => Math.max(d.hdd, d.cdd)) || 800);
      yScale = d3.scaleLinear().domain([0, maxDd * 1.1]).range([innerHeight, 0]).nice();
      yAxisFormatter = (d) => `${d}`;
    } else {
      // wind
      const maxWind = Math.max(18, d3.max(data, (d) => d.windGustMs) || 18);
      yScale = d3.scaleLinear().domain([0, maxWind * 1.15]).range([innerHeight, 0]).nice();
      yAxisFormatter = (d) => `${d}m/s`;
    }

    // Grid lines (subtle dark theme)
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3');

    // Remove outer domain line on grid
    g.selectAll('.grid .domain').remove();

    // Zero reference line for Temperature
    if (metricMode === 'temperature') {
      const zeroY = yScale(0);
      if (zeroY >= 0 && zeroY <= innerHeight) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', zeroY)
          .attr('y2', zeroY)
          .attr('stroke', '#38bdf8')
          .attr('stroke-dasharray', '4,4')
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.65);

        g.append('text')
          .attr('x', innerWidth - 4)
          .attr('y', zeroY - 4)
          .attr('text-anchor', 'end')
          .attr('fill', '#38bdf8')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text('0°C Freeze Threshold');
      }
    }

    // --- DRAW SPECIFIC METRIC VISUALIZATIONS ---

    if (metricMode === 'temperature') {
      // 1. Diurnal Range Shaded Area (High - Low band)
      const areaGen = d3
        .area<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y0((d) => yScale(d.lowTempC))
        .y1((d) => yScale(d.highTempC))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#temp-gradient)')
        .attr('d', areaGen);

      // 2. High Temp line
      const highLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.highTempC))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#f97316')
        .attr('stroke-width', 2.2)
        .attr('d', highLine);

      // 3. Low Temp line
      const lowLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.lowTempC))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2.0)
        .attr('d', lowLine);

      // 4. Mean line (dashed amber)
      const meanLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.avgTempC))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#fbbf24')
        .attr('stroke-dasharray', '4,3')
        .attr('stroke-width', 1.8)
        .attr('d', meanLine);

      // Mean data dots
      g.selectAll('.dot-mean')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.month) || 0)
        .attr('cy', (d) => yScale(d.avgTempC))
        .attr('r', 3.5)
        .attr('fill', '#fbbf24')
        .attr('stroke', '#070a10')
        .attr('stroke-width', 1.5);
    } else if (metricMode === 'solar') {
      // Area under GHI curve
      const areaGen = d3
        .area<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y0(innerHeight)
        .y1((d) => yScale(d.solarGhiKwhM2Day))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#solar-gradient)')
        .attr('d', areaGen);

      // GHI Line (Solid amber)
      const ghiLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.solarGhiKwhM2Day))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2.5)
        .attr('d', ghiLine);

      // DNI Line (Direct Normal Irradiance)
      const dniLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.solarDniKwhM2Day))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '5,3')
        .attr('d', dniLine);

      g.selectAll('.dot-solar')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.month) || 0)
        .attr('cy', (d) => yScale(d.solarGhiKwhM2Day))
        .attr('r', 3.8)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#070a10')
        .attr('stroke-width', 1.5);
    } else if (metricMode === 'degree_days') {
      // Grouped Bar chart for HDD (heating demand) vs CDD (cooling demand)
      const barWidth = Math.max(6, innerWidth / (data.length * 2.8));

      // Heating Degree Days (Blue bars)
      g.selectAll('.bar-hdd')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => (xScale(d.month) || 0) - barWidth - 1)
        .attr('y', (d) => yScale(d.hdd))
        .attr('width', barWidth)
        .attr('height', (d) => innerHeight - yScale(d.hdd))
        .attr('fill', '#38bdf8')
        .attr('rx', 2);

      // Cooling Degree Days (Orange/Red bars)
      g.selectAll('.bar-cdd')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => (xScale(d.month) || 0) + 1)
        .attr('y', (d) => yScale(d.cdd))
        .attr('width', barWidth)
        .attr('height', (d) => innerHeight - yScale(d.cdd))
        .attr('fill', '#f43f5e')
        .attr('rx', 2);
    } else if (metricMode === 'wind') {
      // Wind Speed & Gusts Area
      const areaGen = d3
        .area<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y0((d) => yScale(d.windSpeedMs))
        .y1((d) => yScale(d.windGustMs))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#wind-gradient)')
        .attr('d', areaGen);

      // Mean Wind Speed line
      const speedLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.windSpeedMs))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 2.2)
        .attr('d', speedLine);

      // Peak Gust line
      const gustLine = d3
        .line<MonthlyClimatePoint>()
        .x((d) => xScale(d.month) || 0)
        .y((d) => yScale(d.windGustMs))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-dasharray', '4,3')
        .attr('stroke-width', 1.8)
        .attr('d', gustLine);

      // Prevailing Direction arrow badges along the bottom
      g.selectAll('.wind-dir-text')
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.month) || 0)
        .attr('y', innerHeight - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => d.prevailingWindDir);
    }

    // Axes
    const xAxis = d3.axisBottom(xScale);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.select('.x-axis .domain').attr('stroke', '#334155');
    g.selectAll('.x-axis .tick line').attr('stroke', '#334155');

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(yAxisFormatter);
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.select('.y-axis .domain').attr('stroke', '#334155');
    g.selectAll('.y-axis .tick line').attr('stroke', '#334155');

    // Interactive Hover Scrubbing Overlay
    const hoverLine = g
      .append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1.2)
      .style('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        // Find nearest month
        const eachBand = innerWidth / (data.length - 1);
        const index = Math.max(0, Math.min(data.length - 1, Math.round(mx / eachBand)));
        const point = data[index];
        setHoveredPoint(point);

        const px = xScale(point.month) || 0;
        hoverLine.attr('x1', px).attr('x2', px).style('opacity', 1);
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
        hoverLine.style('opacity', 0);
      });
  }, [metricMode, data, siteLocation]);

  const handleApply = () => {
    if (onApplyStrategy) {
      onApplyStrategy(strategy);
      setHasAppliedStrategy(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Historical Weather & Climate Pattern Card */}
      <div className="bg-[#0B101D] rounded-xl border border-slate-800/90 p-4 shadow-xl">
        {/* Card Header & Metric Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Historical Climate Profile
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {climateProfile.climateZoneCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {climateProfile.climateZoneName} · Lat: {climateProfile.latitude}°N · Elev: {climateProfile.elevationM}m
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-[#070A10] rounded-lg border border-slate-800/80">
            <button
              onClick={() => setMetricMode('temperature')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                metricMode === 'temperature'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Monthly Dry-Bulb Temperatures & Diurnal Extremes"
            >
              <Thermometer className="w-3 h-3" />
              <span>Temp (°C)</span>
            </button>

            <button
              onClick={() => setMetricMode('solar')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                metricMode === 'solar'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Global Horizontal & Direct Normal Solar Irradiance"
            >
              <Sun className="w-3 h-3" />
              <span>Solar GHI</span>
            </button>

            <button
              onClick={() => setMetricMode('degree_days')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                metricMode === 'degree_days'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Heating (HDD) and Cooling (CDD) Degree Days"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>HDD / CDD</span>
            </button>

            <button
              onClick={() => setMetricMode('wind')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                metricMode === 'wind'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Prevailing Wind Velocities, Gusts & Directions"
            >
              <Wind className="w-3 h-3 text-sky-400" />
              <span>Wind (m/s)</span>
            </button>
          </div>
        </div>

        {/* D3.js Responsive SVG Chart Container */}
        <div ref={containerRef} className="w-full relative mt-3 select-none">
          <svg ref={svgRef} className="overflow-visible" />

          {/* Interactive Hover Telemetry Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-2 pointer-events-none z-10 p-2.5 rounded-lg bg-[#070A10]/95 backdrop-blur-md border border-amber-500/40 text-xs shadow-xl min-w-[170px] space-y-1">
              <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-1">
                <span>{hoveredPoint.month} Climate Index</span>
                <span className="font-mono text-amber-400 text-[11px]">{hoveredPoint.prevailingWindDir} wind</span>
              </div>
              {metricMode === 'temperature' && (
                <div className="font-mono text-[11px] space-y-0.5">
                  <div className="text-orange-400 flex justify-between">
                    <span>Avg High:</span> <strong>{hoveredPoint.highTempC}°C</strong>
                  </div>
                  <div className="text-amber-300 flex justify-between">
                    <span>Mean Temp:</span> <strong>{hoveredPoint.avgTempC}°C</strong>
                  </div>
                  <div className="text-sky-400 flex justify-between">
                    <span>Avg Low:</span> <strong>{hoveredPoint.lowTempC}°C</strong>
                  </div>
                  <div className="text-slate-400 text-[10px] pt-1">
                    Diurnal Swing: {(hoveredPoint.highTempC - hoveredPoint.lowTempC).toFixed(1)}°C
                  </div>
                </div>
              )}
              {metricMode === 'solar' && (
                <div className="font-mono text-[11px] space-y-0.5">
                  <div className="text-amber-400 flex justify-between">
                    <span>Global Horiz (GHI):</span> <strong>{hoveredPoint.solarGhiKwhM2Day} kWh/m²</strong>
                  </div>
                  <div className="text-rose-400 flex justify-between">
                    <span>Direct Normal (DNI):</span> <strong>{hoveredPoint.solarDniKwhM2Day} kWh/m²</strong>
                  </div>
                  <div className="text-slate-400 text-[10px] pt-1">
                    Daily Solar Hours: ~{(hoveredPoint.solarGhiKwhM2Day * 2.2).toFixed(1)} hrs
                  </div>
                </div>
              )}
              {metricMode === 'degree_days' && (
                <div className="font-mono text-[11px] space-y-0.5">
                  <div className="text-sky-400 flex justify-between">
                    <span>Heating (HDD):</span> <strong>{hoveredPoint.hdd}</strong>
                  </div>
                  <div className="text-rose-400 flex justify-between">
                    <span>Cooling (CDD):</span> <strong>{hoveredPoint.cdd}</strong>
                  </div>
                  <div className="text-slate-400 text-[10px] pt-1">
                    {hoveredPoint.hdd > hoveredPoint.cdd ? 'Heating Envelope Dominated' : 'Cooling Dominated'}
                  </div>
                </div>
              )}
              {metricMode === 'wind' && (
                <div className="font-mono text-[11px] space-y-0.5">
                  <div className="text-sky-400 flex justify-between">
                    <span>Mean Velocity:</span> <strong>{hoveredPoint.windSpeedMs} m/s</strong>
                  </div>
                  <div className="text-cyan-300 flex justify-between">
                    <span>Peak Gusts:</span> <strong>{hoveredPoint.windGustMs} m/s</strong>
                  </div>
                  <div className="text-slate-400 text-[10px] pt-1">
                    Stagnation: ~{(0.5 * 1.225 * Math.pow(hoveredPoint.windSpeedMs, 2) / 1000).toFixed(2)} kPa
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend & Summary Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-3 font-mono">
            {metricMode === 'temperature' && (
              <>
                <span className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-2.5 h-1 bg-orange-500 rounded" /> Daily High
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Monthly Mean
                </span>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-1 bg-sky-400 rounded" /> Daily Low
                </span>
              </>
            )}
            {metricMode === 'solar' && (
              <>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-1 bg-amber-400 rounded" /> Global Horizontal (GHI)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-0.5 bg-rose-500 border-dashed border-b" /> Direct Normal (DNI)
                </span>
              </>
            )}
            {metricMode === 'degree_days' && (
              <>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm" /> Heating Degree Days (HDD)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Cooling Degree Days (CDD)
                </span>
              </>
            )}
            {metricMode === 'wind' && (
              <>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-3 h-1 bg-sky-500 rounded" /> Mean Velocity
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-3 h-0.5 bg-cyan-300 border-dashed border-b" /> Peak Gusts
                </span>
              </>
            )}
          </div>

          <div className="text-slate-400 font-mono text-[10px]">
            Annual HDD: <strong className="text-sky-300">{climateProfile.annualHdd.toLocaleString()}</strong> · Solar:{' '}
            <strong className="text-amber-300">{climateProfile.annualSolarKwhM2.toLocaleString()} kWh/m²</strong>
          </div>
        </div>
      </div>

      {/* Climate-Informed Massing Strategy Recommendation Panel */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 to-[#0B101D] border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Climate-Informed Building Massing Strategy
              </h4>
            </div>
            <p className="text-[11px] text-amber-200/80 font-medium mt-0.5">
              {strategy.headline}
            </p>
          </div>

          {/* One-Click Apply Button */}
          {onApplyStrategy && (
            <button
              onClick={handleApply}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0 ${
                hasAppliedStrategy
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-emerald-900/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-amber-900/40'
              }`}
              title="Apply these climate-optimized massing parameters to the building model"
            >
              {hasAppliedStrategy ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Massing Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Climate Massing</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Rationale Narrative */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {strategy.rationale}
        </p>

        {/* Parametric Target Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-[#070A10]/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Recommended Archetype</span>
            <span className="font-semibold text-amber-300 text-[11px] truncate block">
              {strategy.recommendedTypologyName}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#070A10]/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Optimal Orientation</span>
            <span className="font-semibold text-white text-[11px]">
              {strategy.recommendedOrientationAzimuth}° Azimuth
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#070A10]/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Target WWR / Louvers</span>
            <span className="font-semibold text-white text-[11px]">
              {Math.round(strategy.recommendedWWR * 100)}% / {strategy.recommendedLouverDepth}m
            </span>
          </div>

          <div className="p-2 rounded-lg bg-[#070A10]/70 border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Green Roof / PV</span>
            <span className="font-semibold text-emerald-400 text-[11px]">
              {strategy.recommendedGreenRoofCoverage}% / {strategy.recommendedPvCoverage}%
            </span>
          </div>
        </div>

        {/* Key Design Directives */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            ACE Mentor Climate-Adaptive Directives:
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400">
            {strategy.keyDesignDirectives.map((directive, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold shrink-0">·</span>
                <span>{directive}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
