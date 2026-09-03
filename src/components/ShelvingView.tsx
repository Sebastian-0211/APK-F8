import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Box,
  AlertTriangle,
  Plus,
  Printer,
  ChevronRight,
  Filter,
  Search,
  Package,
  ArrowRight,
  Tag,
  Settings2,
  Info,
  CheckCircle2,
  Maximize2,
  Grid,
  Sparkles
} from 'lucide-react';
import { AutoPart, RackConfig } from '../types';
import { formatBinCode } from '../utils/barcode';
import { NumberInput } from './common/NumberInput';

interface ShelvingViewProps {
  racks: RackConfig[];
  parts: AutoPart[];
  onSelectPart: (part: AutoPart) => void;
  onAddPartToBin: (rack: number, row: number, column: number) => void;
  onPrintBinLabel: (binCode: string, rack: number, row: number, column: number, partNames: string[]) => void;
  onPrintAllRackBins: (rack: RackConfig) => void;
  onUpdateRackConfig: (updatedRack: RackConfig) => void;
  onAddNewRack: (newRack: RackConfig) => void;
}

export const ShelvingView: React.FC<ShelvingViewProps> = ({
  racks,
  parts,
  onSelectPart,
  onAddPartToBin,
  onPrintBinLabel,
  onPrintAllRackBins,
  onUpdateRackConfig,
  onAddNewRack,
}) => {
  const [selectedRackNumber, setSelectedRackNumber] = useState<number>(racks[0]?.rackNumber || 1);
  const [selectedBin, setSelectedBin] = useState<{
    rack: number;
    row: number;
    column: number;
    binCode: string;
  } | null>(null);
  const [isConfiguringRack, setIsConfiguringRack] = useState<boolean>(false);
  const [isCreatingRack, setIsCreatingRack] = useState<boolean>(false);

  // New Rack State - Default to physical warehouse standard: 4 columns x 12 rows
  const [newRackName, setNewRackName] = useState<string>('');
  const [newRackRows, setNewRackRows] = useState<number>(12);
  const [newRackCols, setNewRackCols] = useState<number>(4);
  const [newRackDesc, setNewRackDesc] = useState<string>('');

  // Filtering & View Mode for 12-row physical shelving
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'TOP' | 'MID' | 'LOW'>('ALL');
  const [binSearch, setBinSearch] = useState<string>('');

  const currentRack = racks.find((r) => r.rackNumber === selectedRackNumber) || racks[0];

  // Map parts by binCode
  const partsByBinCode = parts.reduce((acc: Record<string, AutoPart[]>, part: AutoPart) => {
    const code = part.location.binCode;
    if (!acc[code]) acc[code] = [];
    acc[code].push(part);
    return acc;
  }, {} as Record<string, AutoPart[]>);

  // Rack statistics
  const currentRackParts = parts.filter((p) => p.location.rack === selectedRackNumber);
  const totalRackStockUnits = currentRackParts.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockInRack = currentRackParts.filter((p) => p.quantity <= p.minStock).length;
  const totalBinsInRack = (currentRack?.totalRows || 4) * (currentRack?.totalCols || 5);
  
  // Occupied bins count in current rack
  const occupiedBinsCount = Object.keys(partsByBinCode).filter((code) => {
    return code.startsWith(`EST-${selectedRackNumber}-`);
  }).length;

  const occupancyRate = totalBinsInRack > 0 ? Math.round((occupiedBinsCount / totalBinsInRack) * 100) : 0;

  const handleCreateRackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRackName.trim()) return;
    const nextNumber = Math.max(...racks.map((r) => r.rackNumber), 0) + 1;
    const newRack: RackConfig = {
      rackNumber: nextNumber,
      name: newRackName.trim(),
      totalRows: Number(newRackRows) || 12,
      totalCols: Number(newRackCols) || 4,
      description: newRackDesc.trim(),
      colorTheme: 'blue',
    };
    onAddNewRack(newRack);
    setSelectedRackNumber(nextNumber);
    setIsCreatingRack(false);
    setNewRackName('');
    setNewRackDesc('');
  };

  const handleUpdateRackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRack) return;
    onUpdateRackConfig(currentRack);
    setIsConfiguringRack(false);
  };

  const selectedBinParts = selectedBin ? partsByBinCode[selectedBin.binCode] || [] : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Rack Selector Navigation */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1 font-mono">
              <Layers className="w-4 h-4" />
              Estructura Física del Almacén
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Estanterías y Canastas de Almacenamiento
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Organización matricial por <strong className="text-slate-800">Número de Estantería</strong>,{' '}
              <strong className="text-slate-800">Fila (Nivel)</strong> y{' '}
              <strong className="text-slate-800">Columna de Canasta</strong> para ubicación instantánea.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintAllRackBins(currentRack)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors shadow-xs"
              title="Genera etiquetas con código de barras para todas las canastas de esta estantería"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              Imprimir Etiquetas de Canastas
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingRack(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nueva Estantería
            </button>
          </div>
        </div>

        {/* Rack Pills / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 border-t border-slate-100 mt-4 scrollbar-thin">
          {racks.map((rack) => {
            const isSelected = rack.rackNumber === selectedRackNumber;
            const rackPartsCount = parts.filter((p) => p.location.rack === rack.rackNumber).length;
            return (
              <button
                key={rack.rackNumber}
                type="button"
                onClick={() => {
                  setSelectedRackNumber(rack.rackNumber);
                  setSelectedBin(null);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 border-2 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400'
                }`}
              >
                <Layers className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                <span>Estantería {rack.rackNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rackPartsCount} repuestos
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rack Overview Info & Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main 2D Matrix Shelf Area */}
        <div className="xl:col-span-8 space-y-4">
          {/* Rack Details & Metric Bar */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {currentRack.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsConfiguringRack(!isConfiguringRack)}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                  title="Configurar filas y columnas de esta estantería"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentRack.description || 'Almacenamiento modular en canastas numeradas.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ocupación</span>
                <span className="text-sm font-extrabold text-blue-600 font-mono">{occupancyRate}%</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Canastas</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  {occupiedBinsCount} / {totalBinsInRack}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Unidades</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">{totalRackStockUnits}</span>
              </div>
            </div>
          </div>

          {/* Shelf Configuration Inline Form */}
          {isConfiguringRack && (
            <form
              onSubmit={handleUpdateRackSubmit}
              className="bg-slate-50 border-2 border-blue-500/40 rounded-xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                  <Settings2 className="w-3.5 h-3.5" />
                  Configuración Física: Estantería #{currentRack.rackNumber}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateRackConfig({
                        ...currentRack,
                        totalRows: 12,
                        totalCols: 4,
                      })
                    }
                    className="text-[11px] px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold transition-colors"
                    title="Ajusta automáticamente a 4 columnas y 12 filas (48 canastas)"
                  >
                    📐 Aplicar Estándar Físico (4 Cols × 12 Filas)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfiguringRack(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">
                    Nombre Descriptivo
                  </label>
                  <input
                    type="text"
                    value={currentRack.name}
                    onChange={(e) =>
                      onUpdateRackConfig({ ...currentRack, name: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">
                    Número de Filas (Niveles: 1 a 24)
                  </label>
                  <NumberInput
                    min={1}
                    max={24}
                    value={currentRack.totalRows}
                    onChange={(val) =>
                      onUpdateRackConfig({
                        ...currentRack,
                        totalRows: Math.max(1, val),
                      })
                    }
                    fallbackValue={12}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Estándar físico: 12 filas</span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">
                    Canastas por Fila (Columnas: 1 a 12)
                  </label>
                  <NumberInput
                    min={1}
                    max={12}
                    value={currentRack.totalCols}
                    onChange={(val) =>
                      onUpdateRackConfig({
                        ...currentRack,
                        totalCols: Math.max(1, val),
                      })
                    }
                    fallbackValue={4}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Estándar físico: 4 columnas</span>
                </div>
              </div>
            </form>
          )}

          {/* The Physical Shelving Diagram (Matrix) */}
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
            {/* Shelf Upright Metal Frame Visuals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="font-bold text-slate-800">Estantería #{currentRack.rackNumber}</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentRack.totalCols} Columnas × {currentRack.totalRows} Filas ({currentRack.totalCols * currentRack.totalRows} Canastas)
                </span>
              </div>

              {/* Level Zone Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLevelFilter('ALL')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      levelFilter === 'ALL'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ver Todas ({currentRack.totalRows} Filas)
                  </button>
                  {currentRack.totalRows >= 8 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('TOP')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          levelFilter === 'TOP'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Niveles 9-12 (Superior)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('MID')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          levelFilter === 'MID'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Niveles 5-8 (Medio)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLevelFilter('LOW')}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          levelFilter === 'LOW'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Niveles 1-4 (Inferior)
                      </button>
                    </>
                  )}
                </div>

                {/* Status Legend */}
                <div className="hidden lg:flex items-center gap-3 text-[11px] border-l border-slate-200 pl-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-slate-100 border border-slate-300" />
                    Vacía
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-blue-50 border border-blue-500" />
                    Con Repuestos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-rose-100 border border-rose-500" />
                    Stock Bajo
                  </span>
                </div>
              </div>
            </div>

            {/* Column Headers for Clear Physical Alignment (C1, C2, C3, C4) */}
            <div
              className="grid gap-2 sm:gap-3 mb-2 px-1 text-center text-xs font-mono font-bold text-slate-600"
              style={{
                gridTemplateColumns: `repeat(${currentRack.totalCols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: currentRack.totalCols }, (_, c) => (
                <div
                  key={c}
                  className="bg-slate-100 py-1.5 px-2 rounded-md border border-slate-200 text-slate-700 shadow-xs flex items-center justify-center gap-1"
                >
                  <span className="text-blue-600 font-extrabold">C{c + 1}</span>
                  <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">(Columna {c + 1})</span>
                </div>
              ))}
            </div>

            {/* Matrix Shelf Rows (Rendered from top row down to bottom row) */}
            <div className="space-y-3">
              {Array.from({ length: currentRack.totalRows }, (_, rowIndex) => {
                // Row numbers: Row totalRows down to 1 (or 1 to totalRows)
                const rowNum = currentRack.totalRows - rowIndex;

                // Check zone filter
                if (levelFilter === 'TOP' && rowNum < 9) return null;
                if (levelFilter === 'MID' && (rowNum < 5 || rowNum > 8)) return null;
                if (levelFilter === 'LOW' && rowNum > 4) return null;

                return (
                  <div key={rowNum} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                          F{rowNum}
                        </span>
                        <span className="font-semibold text-slate-700">
                          Nivel / Fila {rowNum}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          {rowNum >= 9 ? '(Nivel Superior)' : rowNum >= 5 ? '(Nivel Medio)' : '(Nivel Inferior / Suelo)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {currentRack.totalCols} canastas
                      </span>
                    </div>

                    {/* Shelf Beam / Horizontal Grid */}
                    <div
                      className="grid gap-2 sm:gap-3 p-2 bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
                      style={{
                        gridTemplateColumns: `repeat(${currentRack.totalCols}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: currentRack.totalCols }, (_, colIndex) => {
                        const colNum = colIndex + 1;
                        const binCode = formatBinCode(currentRack.rackNumber, rowNum, colNum);
                        const binParts = partsByBinCode[binCode] || [];
                        const hasParts = binParts.length > 0;
                        const hasLowStock = binParts.some((p) => p.quantity <= p.minStock);
                        const totalUnits = binParts.reduce((sum, p) => sum + p.quantity, 0);
                        const isSelected = selectedBin?.binCode === binCode;

                        return (
                          <button
                            key={colNum}
                            type="button"
                            onClick={() => {
                              setSelectedBin({
                                rack: currentRack.rackNumber,
                                row: rowNum,
                                column: colNum,
                                binCode,
                              });
                            }}
                            className={`group relative flex flex-col p-2.5 rounded-lg border-2 transition-all text-left min-h-[95px] justify-between ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                                : hasLowStock
                                ? 'bg-rose-50/80 border-rose-400 hover:border-rose-500 shadow-xs'
                                : hasParts
                                ? 'bg-white border-blue-200 hover:border-blue-500 shadow-xs'
                                : 'bg-white/60 border-dashed border-slate-300 hover:bg-white hover:border-slate-400'
                            }`}
                          >
                            {/* Bin Header */}
                            <div className="flex items-center justify-between gap-1 w-full">
                              <span
                                className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : hasParts
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                C{colNum}
                              </span>

                              {hasLowStock && (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              )}
                            </div>

                            {/* Center Content / Part Preview */}
                            <div className="my-1">
                              {hasParts ? (
                                <div>
                                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                                    {binParts[0].name}
                                  </div>
                                  {binParts.length > 1 && (
                                    <div className="text-[10px] text-blue-600 font-semibold">
                                      +{binParts.length - 1} repuesto(s) más
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic flex items-center gap-1">
                                  <Box className="w-3 h-3 text-slate-400" />
                                  Canasta vacía
                                </div>
                              )}
                            </div>

                            {/* Bin Footer Code & Units */}
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 w-full">
                              <span className="font-mono text-slate-400 truncate text-[9px]">
                                {binCode}
                              </span>
                              {hasParts && (
                                <span className="font-bold text-emerald-600 font-mono">
                                  {totalUnits} un.
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Canasta (Bin) Inspector Card */}
        <div className="xl:col-span-4 space-y-4">
          {selectedBin ? (
            <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm space-y-4 sticky top-4">
              {/* Bin Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                      {selectedBin.binCode}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Canasta Activa</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Estantería {selectedBin.rack} • Fila {selectedBin.row} • Columna {selectedBin.column}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBin(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Cerrar
                </button>
              </div>

              {/* Actions for this specific canasta */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onAddPartToBin(selectedBin.rack, selectedBin.row, selectedBin.column)
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Asignar Repuesto
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onPrintBinLabel(
                      selectedBin.binCode,
                      selectedBin.rack,
                      selectedBin.row,
                      selectedBin.column,
                      selectedBinParts.map((p) => p.name)
                    )
                  }
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  Imprimir Etiqueta
                </button>
              </div>

              {/* Stored Parts inside this Basket */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                  <span>Repuestos en esta Canasta ({selectedBinParts.length})</span>
                  <span>
                    Total:{' '}
                    <strong className="text-emerald-600 font-mono">
                      {selectedBinParts.reduce((sum, p) => sum + p.quantity, 0)} unidades
                    </strong>
                  </span>
                </div>

                {selectedBinParts.length > 0 ? (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {selectedBinParts.map((part) => (
                      <div
                        key={part.id}
                        onClick={() => onSelectPart(part)}
                        className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-400 p-3 rounded-lg cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-600 block">
                              {part.sku}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 hover:text-blue-600">
                              {part.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Marca: <span className="text-slate-700 font-medium">{part.brand}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-sm font-extrabold block font-mono ${
                                part.quantity <= part.minStock
                                  ? 'text-rose-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {part.quantity} {part.unit}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ${part.salePrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                          <span className="font-mono">{part.barcode}</span>
                          <span className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold">
                            Ver detalles <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-lg p-6 text-center space-y-2">
                    <Box className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium text-slate-500">
                      Esta canasta aún no tiene repuestos asignados.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onAddPartToBin(selectedBin.rack, selectedBin.row, selectedBin.column)
                      }
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Asignar o registrar un repuesto aquí
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 text-center space-y-3 sticky top-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Selecciona una Canasta en la Cuadrícula
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Haz clic en cualquier canasta para ver los repuestos almacenados, imprimir su código de barras o colocar nuevos repuestos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Rack */}
      {isCreatingRack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateRackSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                Crear Nueva Estantería
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingRack(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre de la Estantería *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Estantería 5 - Frenos y Discos Pesados"
                  value={newRackName}
                  onChange={(e) => setNewRackName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Número de Filas (Niveles) *
                  </label>
                  <NumberInput
                    min={1}
                    max={24}
                    value={newRackRows}
                    onChange={(val) => setNewRackRows(val)}
                    fallbackValue={12}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Estándar físico: 12</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Canastas por Fila (Columnas) *
                  </label>
                  <NumberInput
                    min={1}
                    max={12}
                    value={newRackCols}
                    onChange={(val) => setNewRackCols(val)}
                    fallbackValue={4}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Estándar físico: 4</span>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                <span>Total de canastas calculadas: <strong>{newRackRows * newRackCols} canastas</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setNewRackRows(12);
                    setNewRackCols(4);
                  }}
                  className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold border border-blue-300 transition-colors"
                >
                  📐 Cargar 4 Cols × 12 Filas
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Descripción o Categoría Principal
                </label>
                <textarea
                  rows={2}
                  placeholder="ej: Pastillas cerámicas, discos ventilados y bombas auxiliares"
                  value={newRackDesc}
                  onChange={(e) => setNewRackDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreatingRack(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Guardar Estantería
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
