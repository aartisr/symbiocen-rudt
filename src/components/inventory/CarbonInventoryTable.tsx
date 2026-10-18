import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { MaterialInventoryItem, SimulationMetrics } from '../../types';
import {
  ArrowUpDown,
  Leaf,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface CarbonInventoryTableProps {
  items: MaterialInventoryItem[];
  metrics: SimulationMetrics;
  onApplyAlternative: (item: MaterialInventoryItem) => void;
}

const columnHelper = createColumnHelper<MaterialInventoryItem>();

export const CarbonInventoryTable: React.FC<CarbonInventoryTableProps> = ({
  items,
  metrics,
  onApplyAlternative,
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'totalEmbodiedKgCo2', desc: true },
  ]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Filter items by category
  const filteredData = useMemo(() => {
    if (categoryFilter === 'All') return items;
    return items.filter((item) => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          <span className="text-xs font-medium text-slate-400">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('materialName', {
        header: 'Assembly & Specification',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                {row.materialName}
                {row.isLowCarbonAlternative && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Leaf className="w-2.5 h-2.5" /> Bio-Sink
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-xs">
                {row.specification}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('quantity', {
        header: 'Quantity',
        cell: (info) => (
          <span className="text-xs font-mono tabular-nums text-slate-300">
            {info.getValue().toLocaleString()} {info.row.original.unit}
          </span>
        ),
      }),
      columnHelper.accessor('embodiedCarbonGwp', {
        header: 'GWP Factor',
        cell: (info) => {
          const val = info.getValue();
          const isNegative = val < 0;
          return (
            <span
              className={`text-xs font-mono tabular-nums ${
                isNegative ? 'text-emerald-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {val > 0 ? `+${val}` : val} kgCO₂e/{info.row.original.unit}
            </span>
          );
        },
      }),
      columnHelper.accessor('totalEmbodiedKgCo2', {
        header: 'Total Carbon',
        cell: (info) => {
          const totalKg = info.getValue();
          const tonnes = (totalKg / 1000).toFixed(1);
          const isSink = totalKg < 0;
          return (
            <span
              className={`text-xs font-mono tabular-nums font-semibold ${
                isSink ? 'text-emerald-400' : totalKg > 100000 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {isSink ? `${tonnes} t CO₂ (Stored)` : `+${tonnes} t CO₂e`}
            </span>
          );
        },
      }),
      columnHelper.accessor('circularityScore', {
        header: 'Circularity',
        cell: (info) => {
          const score = info.getValue();
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {score}%
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Low-Carbon Action',
        cell: (info) => {
          const row = info.row.original;
          if (row.alternativeSuggestion) {
            return (
              <button
                onClick={() => onApplyAlternative(row)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-[11px] font-medium text-emerald-300 transition-colors"
                title={row.alternativeSuggestion.keyBenefit}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Substitute ({row.alternativeSuggestion.gwpDeltaPercent}%)</span>
              </button>
            );
          }
          return (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Optimized
            </span>
          );
        },
      }),
    ],
    [onApplyAlternative]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const categories = ['All', 'Substructure', 'Superstructure', 'Envelope', 'Renewables'];

  return (
    <div className="flex flex-col h-full bg-[#0E1524] rounded-xl border border-slate-800 overflow-hidden">
      {/* Top Carbon KPI Strip */}
      <div className="p-4 bg-[#111A2E] border-b border-slate-800/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 flex items-center gap-1 mb-0.5">
              <span>Embodied Intensity</span>
              <Info className="w-3 h-3 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {metrics.embodiedCarbon.perSqMeter}
              </span>
              <span className="text-slate-400 text-[11px]">kgCO₂e/m²</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  metrics.embodiedCarbon.rating === 'A'
                    ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-800'
                    : metrics.embodiedCarbon.rating === 'B'
                    ? 'bg-blue-900/60 text-blue-400 border border-blue-800'
                    : 'bg-amber-900/60 text-amber-400 border border-amber-800'
                }`}
              >
                Grade {metrics.embodiedCarbon.rating}
              </span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 mb-0.5">Biogenic Atmospheric Carbon</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                -{(metrics.embodiedCarbon.biogenicCarbonStoredKg / 1000).toFixed(0)}
              </span>
              <span className="text-slate-400 text-[11px]">tonnes CO₂ sequestered</span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 mb-0.5">Circularity Index</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {metrics.embodiedCarbon.circularityIndex}%
              </span>
              <span className="text-slate-400 text-[11px]">salvageable</span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 mb-0.5">Regulatory Compliance</div>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>BERDO 2.0 & MA Stretch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0B0F17]/60 border-b border-slate-800/80">
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {filteredData.length} assemblies logged (EC3 standard)
        </span>
      </div>

      {/* TanStack Interactive Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-800 bg-[#0B0F17]/40 sticky top-0 z-10">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 cursor-pointer select-none hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-800/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3.5 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
