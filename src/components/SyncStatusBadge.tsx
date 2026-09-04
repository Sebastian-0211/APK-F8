import React, { useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Smartphone, Monitor, CheckCircle2, QrCode, X, Copy, Check } from 'lucide-react';
import { SyncStatus } from '../services/cloudSyncService';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  itemsCount: number;
  onForceSync?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  lastSyncedAt,
  itemsCount,
  onForceSync,
}) => {
  const [showTwinModal, setShowTwinModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // QR Code generator URL using public standard API for mobile camera pairing
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Pill */}
        <button
          type="button"
          onClick={() => setShowTwinModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
            status === 'synced'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : status === 'syncing'
              ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
              : status === 'connecting'
              ? 'bg-sky-50 text-sky-800 border-sky-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
          title="Ver estado de sincronización y conectar celular"
        >
          {status === 'synced' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Nube Activa (Gemelos Sincronizados)</span>
              <span className="sm:hidden">Nube OK</span>
            </>
          )}

          {status === 'syncing' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Sincronizando...</span>
            </>
          )}

          {status === 'connecting' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              <span>Conectando Nube...</span>
            </>
          )}

          {status === 'offline' && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-rose-600" />
              <span>Modo Local (Sin Nube)</span>
            </>
          )}

          {status === 'error' && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-rose-600" />
              <span>Error de Conexión</span>
            </>
          )}
        </button>

        {/* Mobile Pair Button */}
        <button
          type="button"
          onClick={() => setShowTwinModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs"
          title="Abrir gemelo digital en el celular"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden md:inline">Vincular Celular</span>
          <QrCode className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Modal Gemelos Digitales (PC + Celular) */}
      {showTwinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gemelos Digitales (PC & Celular)</h3>
                  <p className="text-xs text-slate-500">Sincronización de inventario y ventas en tiempo real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTwinModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="my-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="font-semibold block">Computadora</span>
                  <span className="text-[11px] text-slate-500">Caja / Despacho</span>
                </div>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">⚡ En Tiempo Real</span>
                <span className="h-0.5 w-16 bg-emerald-400 rounded-full my-1"></span>
                <span className="text-[10px] text-slate-400">Firebase Firestore</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="font-semibold block">Celular / Tablet</span>
                  <span className="text-[11px] text-slate-500">Bodega / Escáner</span>
                </div>
                <Smartphone className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl mb-4">
              <p className="text-xs font-medium text-slate-700 mb-3 text-center">
                Escanea con la cámara de tu celular para abrir este mismo sistema:
              </p>
              <div className="p-2 bg-white rounded-lg border-2 border-dashed border-indigo-200 shadow-xs">
                <img
                  src={qrCodeUrl}
                  alt="Código QR para abrir en celular"
                  className="w-44 h-44 object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Cualquier cambio hecho en el móvil o PC se reflejará instantáneamente en ambos.
              </p>
            </div>

            {/* URL Copy */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Enlace directo:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Summary & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{itemsCount} repuestos sincronizados</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onForceSync?.();
                  setShowTwinModal(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
