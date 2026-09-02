import React, { useState, useMemo } from 'react';
import {
  X,
  ScanLine,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Package,
  Layers,
  Sparkles,
  Minus,
  Plus,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { AutoPart, AppUser, StockMovement } from '../types';
import { soundManager } from '../utils/audio';

interface ManualDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
  currentUser: AppUser;
  onDispatchPart: (partId: string, qty: number, source: 'MANUAL', customReason?: string) => boolean;
  onReceivePart: (partId: string, qty: number, source: 'MANUAL', customReason?: string) => boolean;
}

export const ManualDispatchModal: React.FC<ManualDispatchModalProps> = ({
  isOpen,
  onClose,
  parts,
  currentUser,
  onDispatchPart,
  onReceivePart,
}) => {
  const [operationType, setOperationType] = useState<'OUT' | 'IN'>('OUT');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<AutoPart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Pistola de código de barras averiada / Fuera de servicio');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const PRESET_REASONS_OUT = [
    'Pistola de código de barras averiada / Sin batería',
    'Venta manual de emergencia en mostrador',
    'Despacho urgente a taller mecánico',
    'Material dañado / merma justificada',
    'Ajuste por conteo físico de inventario',
  ];

  const PRESET_REASONS_IN = [
    'Recepción manual por proveedor',
    'Devolución de cliente por garantía',
    'Ajuste sobrante por conteo físico',
    'Ingreso urgente sin pistola escáner',
  ];

  // Filter parts for manual search
  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return parts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.oemCode && p.oemCode.toLowerCase().includes(q)) ||
          p.location.binCode.toLowerCase().includes(q) ||
          p.compatibleVehicles.some((v) => v.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [searchQuery, parts]);

  if (!isOpen) return null;

  const handleSelectPart = (part: AutoPart) => {
    setSelectedPart(part);
    setQuantity(1);
    setFeedback(null);
  };

  const handleExecuteOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) {
      setFeedback({ success: false, message: 'Por favor selecciona un repuesto del inventario.' });
      return;
    }

    if (quantity <= 0) {
      setFeedback({ success: false, message: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    const fullReason = `${reason.trim()} (Operador: ${currentUser.name})`;

    if (operationType === 'OUT') {
      if (selectedPart.quantity < quantity) {
        soundManager.playWarningBeep();
        setFeedback({
          success: false,
          message: `Stock insuficiente. Solo hay ${selectedPart.quantity} ${selectedPart.unit} en la canasta [${selectedPart.location.binCode}].`,
        });
        return;
      }

      const ok = onDispatchPart(selectedPart.id, quantity, 'MANUAL', fullReason);
      if (ok) {
        soundManager.playSuccessBeep();
        setFeedback({
          success: true,
          message: `Se descontaron con éxito ${quantity} ${selectedPart.unit} de "${selectedPart.name}" (Canasta: ${selectedPart.location.binCode}).`,
        });
        // Update local selected part quantity
        setSelectedPart({
          ...selectedPart,
          quantity: selectedPart.quantity - quantity,
        });
      }
    } else {
      const ok = onReceivePart(selectedPart.id, quantity, 'MANUAL', fullReason);
      if (ok) {
        soundManager.playSuccessBeep();
        setFeedback({
          success: true,
          message: `Se ingresaron con éxito ${quantity} ${selectedPart.unit} a "${selectedPart.name}" (Canasta: ${selectedPart.location.binCode}).`,
        });
        setSelectedPart({
          ...selectedPart,
          quantity: selectedPart.quantity + quantity,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-600">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Despacho / Ajuste Manual de Material (Sin Pistola)
                </h2>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-extrabold uppercase font-mono">
                  Emergencia
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Descuenta o suma material del inventario si el lector de código de barras no está disponible
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Operation selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setOperationType('OUT');
                setReason(PRESET_REASONS_OUT[0]);
                setFeedback(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                operationType === 'OUT'
                  ? 'border-rose-300 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs text-rose-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs block font-bold">Despacho Manual (Resta Stock)</strong>
                <span className="text-[11px] text-slate-500">Salida de mostrador o entrega a taller</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperationType('IN');
                setReason(PRESET_REASONS_IN[0]);
                setFeedback(null);
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                operationType === 'IN'
                  ? 'border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs text-emerald-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs block font-bold">Recepción Manual (Suma Stock)</strong>
                <span className="text-[11px] text-slate-500">Ingreso de proveedor o devolución</span>
              </div>
            </button>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                feedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Search Part */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Buscar Repuesto por Nombre, SKU, OEM, Marca o Canasta *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ej: Pastillas Brembo, 7501001002011, Corolla, EST-1-F1-C1..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Quick search suggestions */}
            {filteredParts.length > 0 && (
              <div className="mt-1.5 border border-slate-200 rounded-lg bg-white shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filteredParts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      handleSelectPart(p);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Marca: {p.brand}</span>
                        <span>•</span>
                        <span>SKU: {p.sku}</span>
                        <span>•</span>
                        <span className="font-mono font-semibold text-blue-700">[{p.location.binCode}]</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Stock: {p.quantity} {p.unit}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold font-mono">
                        ${p.salePrice.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Part Card */}
          {selectedPart ? (
            <div className="p-4 bg-slate-50 border-2 border-blue-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                      {selectedPart.category}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      SKU: {selectedPart.sku}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedPart.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Marca: <strong>{selectedPart.brand}</strong> • Modelos: {selectedPart.compatibleVehicles.slice(0, 2).join(', ')}
                  </div>
                </div>

                <div className="text-right bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs shrink-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Canasta Física</div>
                  <div className="text-xs font-mono font-bold text-blue-700 flex items-center gap-1 justify-end">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {selectedPart.location.binCode}
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    Disponible: {selectedPart.quantity} {selectedPart.unit}
                  </div>
                </div>
              </div>

              {/* Action Form for the selected part */}
              <form onSubmit={handleExecuteOperation} className="pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cantidad a {operationType === 'OUT' ? 'Descontar' : 'Ingresar'} *
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={operationType === 'OUT' ? selectedPart.quantity : 999}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((prev) =>
                            operationType === 'OUT' && prev >= selectedPart.quantity ? prev : prev + 1
                          )
                        }
                        className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Motivo del Ajuste Manual *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    >
                      {(operationType === 'OUT' ? PRESET_REASONS_OUT : PRESET_REASONS_IN).map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Registrado por: <strong>{currentUser.name}</strong></span>
                  </div>

                  <button
                    type="submit"
                    className={`px-4 py-2 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors ${
                      operationType === 'OUT'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {operationType === 'OUT' ? (
                      <>
                        <ArrowDownRight className="w-4 h-4" />
                        <span>Confirmar Despacho (-{quantity})</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Confirmar Ingreso (+{quantity})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">Sin repuesto seleccionado</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
                Utiliza el buscador superior para localizar la pieza que deseas descontar o ingresar manualmente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
