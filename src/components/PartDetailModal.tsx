import React, { useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Barcode as BarcodeIcon,
  Printer,
  Edit2,
  Trash2,
  Car,
  DollarSign,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { AutoPart, StockMovement } from '../types';
import { renderBarcodeToElement } from '../utils/barcode';

interface PartDetailModalProps {
  part: AutoPart | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (part: AutoPart) => void;
  onDelete: (partId: string) => void;
  onPrint: (part: AutoPart) => void;
  movements: StockMovement[];
  onQuickStockChange: (partId: string, delta: number) => void;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  part,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  movements,
  onQuickStockChange,
}) => {
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (part && barcodeSvgRef.current) {
      renderBarcodeToElement(barcodeSvgRef.current, part.barcode, {
        height: 50,
        width: 2,
        fontSize: 14,
      });
    }
  }, [part]);

  if (!isOpen || !part) return null;

  const partMovements = movements.filter((m) => m.partId === part.id);
  const isLow = part.quantity <= part.minStock && part.quantity > 0;
  const isOut = part.quantity === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {part.category}
            </span>
            <span className="text-xs font-mono text-slate-500 font-semibold">SKU: {part.sku}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onPrint(part);
              }}
              className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-300 shadow-xs transition-colors"
              title="Imprimir Etiqueta"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(part);
                onClose();
              }}
              className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-300 shadow-xs transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Info */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{part.name}</h2>
            <p className="text-sm text-slate-600 mt-0.5 font-medium">
              Fabricante / Marca: <strong className="text-slate-900 font-bold">{part.brand}</strong>
              {part.oemCode && (
                <span className="ml-3 font-mono text-slate-500">
                  OEM: {part.oemCode}
                </span>
              )}
            </p>
          </div>

          {/* Barcode Visual Box */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-xs">
            <svg ref={barcodeSvgRef} className="max-w-full" />
          </div>

          {/* Location & Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shelf Location Box */}
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-xl p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Ubicación Asignada en Almacén
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">
                {part.location.binCode}
              </div>
              <p className="text-xs text-slate-700">
                • <strong>Estantería:</strong> #{part.location.rack}
                <br />• <strong>Fila (Nivel):</strong> {part.location.row}
                <br />• <strong>Canasta (Columna):</strong> {part.location.column}
              </p>
              {part.location.binLabel && (
                <div className="text-[11px] text-blue-800 bg-white px-2 py-1 rounded border border-blue-200 inline-block font-medium">
                  Etiqueta: {part.location.binLabel}
                </div>
              )}
            </div>

            {/* Stock & Quick Adjust */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Existencias en Canasta
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono mt-1 ${
                    isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {part.quantity} {part.unit}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Stock Mínimo de Alerta: {part.minStock} {part.unit}
                </div>
              </div>

              {/* Quick dispatch / receive */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onQuickStockChange(part.id, -1)}
                  disabled={part.quantity <= 0}
                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
                >
                  -1 Despacho
                </button>
                <button
                  type="button"
                  onClick={() => onQuickStockChange(part.id, 1)}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  +1 Entrada
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Vehicles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Prices */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-600 text-[11px] font-bold block font-mono uppercase">
                Estructura de Precios
              </span>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 font-medium">Precio de Venta al Público:</span>
                <span className="text-sm font-bold font-mono text-emerald-600">
                  ${part.salePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Costo de Compra:</span>
                <span className="font-mono text-slate-700 font-bold">
                  ${part.costPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Compatible Vehicles */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-slate-600 text-[11px] font-bold block flex items-center gap-1 font-mono uppercase">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                Vehículos Compatibles
              </span>
              <div className="flex flex-wrap gap-1">
                {part.compatibleVehicles.map((v, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[11px] font-medium"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          {part.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-700 font-bold block mb-1">Notas Técnicas:</span>
              <p className="text-slate-600">{part.notes}</p>
            </div>
          )}

          {/* Recent movements for this part */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Historial de Movimientos ({partMovements.length})
            </span>

            {partMovements.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {partMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          mov.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {mov.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                      </span>
                      <span className="text-slate-800 font-medium">{mov.reason}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold ${
                          mov.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Aún no hay movimientos registrados para este repuesto.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(part.id)}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar Repuesto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
