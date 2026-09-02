import React, { useState } from 'react';
import {
  X,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Download,
  Filter,
  Search,
  ScanLine,
  Camera,
  Layers,
  MapPin
} from 'lucide-react';
import { StockMovement } from '../types';

interface MovementsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: StockMovement[];
  onClearMovements: () => void;
}

export const MovementsLogModal: React.FC<MovementsLogModalProps> = ({
  isOpen,
  onClose,
  movements,
  onClearMovements,
}) => {
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredMovements = movements.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = m.partName.toLowerCase().includes(q);
      const matchSku = m.sku.toLowerCase().includes(q);
      const matchBarcode = m.barcode.toLowerCase().includes(q);
      const matchReason = m.reason.toLowerCase().includes(q);
      const matchBin = m.locationBin.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBarcode && !matchReason && !matchBin) {
        return false;
      }
    }

    if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
    if (sourceFilter !== 'ALL' && m.source !== sourceFilter) return false;

    return true;
  });

  const handleExportCSV = () => {
    if (movements.length === 0) return;

    const headers = [
      'ID',
      'Fecha y Hora',
      'Tipo',
      'Repuesto',
      'SKU',
      'Codigo de Barras',
      'Canasta (Ubicacion)',
      'Cambio Cantidad',
      'Stock Anterior',
      'Stock Resultante',
      'Motivo',
      'Origen',
    ];

    const rows = movements.map((m) => [
      m.id,
      new Date(m.timestamp).toLocaleString(),
      m.type === 'IN' ? 'ENTRADA' : m.type === 'OUT' ? 'SALIDA' : 'AJUSTE',
      `"${m.partName.replace(/"/g, '""')}"`,
      m.sku,
      m.barcode,
      m.locationBin,
      m.quantityChange,
      m.previousStock,
      m.newStock,
      `"${m.reason.replace(/"/g, '""')}"`,
      m.source,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_repuestos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Kardex e Historial de Movimientos
              </h2>
              <p className="text-xs text-slate-500">
                Auditoría de despachos con pistola, ingresos de inventario y ajustes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por repuesto, SKU, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-medium"
          >
            <option value="ALL">Todos los Tipos de Movimiento</option>
            <option value="OUT">Solo Despachos (Salidas)</option>
            <option value="IN">Solo Ingresos (Entradas)</option>
            <option value="ADJUST">Solo Ajustes Manuales</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-medium"
          >
            <option value="ALL">Todos los Orígenes</option>
            <option value="SCANNER_GUN">🔫 Pistola de Código de Barras</option>
            <option value="CAMERA_SCAN">📱 Cámara de Celular</option>
            <option value="MANUAL">💻 Ajuste Manual / Teclado</option>
          </select>
        </div>

        {/* Movements Table */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredMovements.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-sans uppercase font-bold text-[11px]">
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 font-sans">Repuesto</th>
                    <th className="py-2.5 px-3">Ubicación</th>
                    <th className="py-2.5 px-3 text-center">Cambio</th>
                    <th className="py-2.5 px-3 text-center">Stock</th>
                    <th className="py-2.5 px-3 font-sans">Origen / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMovements.map((mov) => {
                    const isOut = mov.type === 'OUT';
                    const isIn = mov.type === 'IN';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {new Date(mov.timestamp).toLocaleString()}
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isIn
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isOut ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            ) : isIn ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                            )}
                            {isOut ? 'SALIDA' : isIn ? 'ENTRADA' : 'AJUSTE'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-sans max-w-[200px]">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {mov.partName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {mov.sku} • {mov.barcode}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px] font-bold font-mono">
                            {mov.locationBin}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-xs font-bold font-mono ${
                              mov.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center text-slate-700 text-[11px]">
                          <span className="text-slate-400">{mov.previousStock}</span>
                          <span className="text-slate-300 mx-1">→</span>
                          <span className="font-bold text-slate-900">{mov.newStock}</span>
                        </td>

                        <td className="py-2.5 px-3 font-sans max-w-[220px]">
                          <div className="text-xs text-slate-800 font-medium truncate">
                            {mov.reason}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            {mov.source === 'SCANNER_GUN' && (
                              <span className="text-blue-600 font-semibold">🔫 Pistola Barcode</span>
                            )}
                            {mov.source === 'CAMERA_SCAN' && (
                              <span className="text-sky-600 font-semibold">📱 Cámara</span>
                            )}
                            {mov.source === 'MANUAL' && <span>💻 Teclado / Manual</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs">No se encontraron movimientos con los filtros actuales.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <span className="font-mono">Total movimientos: {filteredMovements.length}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClearMovements}
              className="text-slate-500 hover:text-rose-600 text-xs font-bold transition-colors"
            >
              Borrar Historial
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
