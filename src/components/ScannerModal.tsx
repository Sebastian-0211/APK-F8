import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  ScanLine,
  Camera,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Plus,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Zap,
  MapPin,
  Barcode as BarcodeIcon,
  Tag,
  Car,
  DollarSign,
  PackageCheck,
  Undo2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AutoPart, ScannerOperationMode, StockMovement } from '../types';
import { soundManager } from '../utils/audio';
import { renderBarcodeToElement } from '../utils/barcode';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
  onDispatchPart: (partId: string, qty: number, source: 'SCANNER_GUN' | 'CAMERA_SCAN' | 'MANUAL') => boolean;
  onReceivePart: (partId: string, qty: number, source: 'SCANNER_GUN' | 'CAMERA_SCAN' | 'MANUAL') => boolean;
  onOpenCreateWithBarcode: (barcode: string) => void;
  onSelectPartForInspection: (part: AutoPart) => void;
}

interface ScanResultEvent {
  id: string;
  code: string;
  part?: AutoPart;
  mode: ScannerOperationMode;
  success: boolean;
  message: string;
  timestamp: string;
  qtyChanged?: number;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  parts,
  onDispatchPart,
  onReceivePart,
  onOpenCreateWithBarcode,
  onSelectPartForInspection,
}) => {
  const [mode, setMode] = useState<ScannerOperationMode>('DISPATCH');
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recentScans, setRecentScans] = useState<ScanResultEvent[]>([]);
  const [lastScannedPart, setLastScannedPart] = useState<AutoPart | null>(null);
  const [lastScanStatus, setLastScanStatus] = useState<{ success: boolean; message: string } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'html5-scanner-box';
  const barcodeCanvasRef = useRef<SVGSVGElement | null>(null);

  // Render barcode image when last scanned part is set
  useEffect(() => {
    if (lastScannedPart && barcodeCanvasRef.current) {
      renderBarcodeToElement(barcodeCanvasRef.current, lastScannedPart.barcode, {
        height: 35,
        width: 1.8,
        fontSize: 12,
      });
    }
  }, [lastScannedPart]);

  // Process barcode input from any source (Hardware Gun, Camera, or Manual)
  const handleProcessBarcode = useCallback((barcodeInput: string, source: 'SCANNER_GUN' | 'CAMERA_SCAN' | 'MANUAL') => {
    const code = barcodeInput.trim();
    if (!code) return;

    // Search by exact barcode or SKU or OEM code
    const matchedPart = parts.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase() ||
        (p.oemCode && p.oemCode.toLowerCase() === code.toLowerCase())
    );

    if (!matchedPart) {
      soundManager.playErrorBeep();
      setLastScannedPart(null);
      const notFoundEvent: ScanResultEvent = {
        id: Math.random().toString(),
        code,
        mode,
        success: false,
        message: `Código "${code}" no encontrado en inventario.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanStatus({
        success: false,
        message: `El código "${code}" no está registrado en el inventario.`,
      });
      setRecentScans((prev) => [notFoundEvent, ...prev.slice(0, 19)]);
      return;
    }

    setLastScannedPart(matchedPart);

    if (mode === 'DISPATCH') {
      if (matchedPart.quantity <= 0) {
        soundManager.playWarningBeep();
        setLastScanStatus({
          success: false,
          message: `¡Agotado! ${matchedPart.name} no tiene unidades disponibles para despacho.`,
        });
        return;
      }
      const success = onDispatchPart(matchedPart.id, batchQuantity, source);
      if (success) {
        soundManager.playSuccessBeep();
        const successEvent: ScanResultEvent = {
          id: Math.random().toString(),
          code,
          part: matchedPart,
          mode: 'DISPATCH',
          success: true,
          qtyChanged: -batchQuantity,
          message: `Despachado: -${batchQuantity} ${matchedPart.unit} (${matchedPart.name})`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLastScanStatus({
          success: true,
          message: `✅ Despachado: -${batchQuantity} unidad(es) de "${matchedPart.name}". Ubicación: ${matchedPart.location.binCode}`,
        });
        setRecentScans((prev) => [successEvent, ...prev.slice(0, 19)]);
      }
    } else if (mode === 'RECEIVE') {
      const success = onReceivePart(matchedPart.id, batchQuantity, source);
      if (success) {
        soundManager.playSuccessBeep();
        const successEvent: ScanResultEvent = {
          id: Math.random().toString(),
          code,
          part: matchedPart,
          mode: 'RECEIVE',
          success: true,
          qtyChanged: batchQuantity,
          message: `Ingresado: +${batchQuantity} ${matchedPart.unit} (${matchedPart.name})`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setLastScanStatus({
          success: true,
          message: `✅ Ingresado: +${batchQuantity} unidad(es) de "${matchedPart.name}". Nuevo stock: ${matchedPart.quantity + batchQuantity}`,
        });
        setRecentScans((prev) => [successEvent, ...prev.slice(0, 19)]);
      }
    } else if (mode === 'LOOKUP') {
      soundManager.playDoubleBeep();
      const lookupEvent: ScanResultEvent = {
        id: Math.random().toString(),
        code,
        part: matchedPart,
        mode: 'LOOKUP',
        success: true,
        message: `Consulta: ${matchedPart.name} | Ubicación: ${matchedPart.location.binCode} | Stock: ${matchedPart.quantity}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastScanStatus({
        success: true,
        message: `🔍 Ubicado en ${matchedPart.location.binCode} (Estantería ${matchedPart.location.rack}, Fila ${matchedPart.location.row}, Canasta ${matchedPart.location.column})`,
      });
      setRecentScans((prev) => [lookupEvent, ...prev.slice(0, 19)]);
    } else if (mode === 'REGISTER') {
      soundManager.playSuccessBeep();
      onOpenCreateWithBarcode(code);
      onClose();
    }
  }, [parts, mode, batchQuantity, onDispatchPart, onReceivePart, onOpenCreateWithBarcode, onClose]);

  // Camera Scanner Lifecycle
  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let isRunning = false;

    if (isOpen && useCamera) {
      setCameraError(null);
      const timer = setTimeout(() => {
        try {
          scanner = new Html5Qrcode(scannerRegionId);
          html5QrCodeRef.current = scanner;

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 180 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
          };

          scanner
            .start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                // Debounce rapid continuous frame hits
                handleProcessBarcode(decodedText, 'CAMERA_SCAN');
              },
              () => {
                // Ignore silent frame errors while seeking
              }
            )
            .then(() => {
              isRunning = true;
            })
            .catch((err) => {
              console.warn('Camera start error:', err);
              setCameraError('No se pudo acceder a la cámara o no hay permisos concedidos.');
            });
        } catch (e) {
          setCameraError('Error al iniciar el módulo de cámara.');
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (scanner && isRunning) {
          scanner.stop().catch(() => {}).finally(() => {
            scanner?.clear();
          });
        }
      };
    } else {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrCodeRef.current?.clear();
        });
      }
    }
  }, [isOpen, useCamera, handleProcessBarcode]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessBarcode(manualCode, 'MANUAL');
    setManualCode('');
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playSuccessBeep();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="scanner-modal-container"
        className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <ScanLine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Terminal de Escaneo de Códigos
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Lector Activo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Compatible con pistolas USB/Bluetooth y cámara de celular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              title={soundEnabled ? 'Sonido de bip activado' : 'Sonido desactivado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100/70 border-b border-slate-200 p-2 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setMode('DISPATCH')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all border-2 ${
                mode === 'DISPATCH'
                  ? 'bg-rose-50 text-rose-700 border-rose-500 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>Despacho (Salida)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('RECEIVE')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all border-2 ${
                mode === 'RECEIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>Ingreso (Entrada)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('LOOKUP')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all border-2 ${
                mode === 'LOOKUP'
                  ? 'bg-blue-50 text-blue-700 border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Ver Ubicación</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('REGISTER')}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all border-2 ${
                mode === 'REGISTER'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Nuevo Repuesto</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Top Banner / Hardware Gun Instructions */}
          <div className="bg-blue-50/70 rounded-xl p-3 sm:p-4 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Pistola de Código de Barras Lista
                </p>
                <p className="text-xs text-slate-500">
                  {mode === 'DISPATCH' && 'Apunta a la caja del repuesto para descontar automáticamente del inventario.'}
                  {mode === 'RECEIVE' && 'Apunta a los repuestos recibidos para sumar stock automáticamente.'}
                  {mode === 'LOOKUP' && 'Apunta al código para ver en qué estantería y canasta se almacena.'}
                  {mode === 'REGISTER' && 'Escanea un código nuevo para iniciar el formulario con los datos listos.'}
                </p>
              </div>
            </div>

            {/* Batch Quantity Selector for IN/OUT */}
            {(mode === 'DISPATCH' || mode === 'RECEIVE') && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 self-stretch sm:self-auto justify-between shadow-xs">
                <span className="text-xs font-semibold text-slate-600">Cantidad por disparo:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBatchQuantity(Math.max(1, batchQuantity - 1))}
                    className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-blue-600 font-mono">
                    {batchQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBatchQuantity(batchQuantity + 1)}
                    className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scanner Input Panels: Camera & Manual Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Camera / Scanner viewport */}
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  Cámara de Dispositivo Móvil
                </span>
                <button
                  type="button"
                  onClick={() => setUseCamera(!useCamera)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 border ${
                    useCamera
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {useCamera ? 'Apagar Cámara' : 'Encender Cámara'}
                </button>
              </div>

              {useCamera ? (
                <div className="relative bg-slate-900 border-2 border-slate-300 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center">
                  <div id={scannerRegionId} className="w-full h-full" />
                  {cameraError && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
                      <p className="text-xs text-rose-600 max-w-xs font-semibold">{cameraError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2.5 min-h-[180px]">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Pistola de Mano o Entrada Rápida
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Dispara con tu lector USB/Bluetooth o activa la cámara para usar el celular como lector de almacén.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseCamera(true)}
                    className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-blue-600 rounded-lg transition-colors shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Escanear con Cámara
                  </button>
                </div>
              )}

              {/* Manual Barcode Search or Trigger */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Escribir o simular código (ej: 7501001002011)..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono transition-colors focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Procesar
                </button>
              </form>

              {/* Quick Simulator Codes for Testing */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  🧪 Repuestos para prueba rápida:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parts.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProcessBarcode(p.barcode, 'MANUAL')}
                      className="text-[11px] font-mono px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                      title={p.name}
                    >
                      <span className="text-blue-600 font-bold">{p.sku}:</span>
                      <span className="truncate max-w-[90px]">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Last Scanned Part Card & Result Banner */}
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
                Resultado del Último Disparo
              </span>

              {/* Status Alert */}
              {lastScanStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs font-medium flex items-start gap-2.5 ${
                    lastScanStatus.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {lastScanStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{lastScanStatus.message}</span>
                </div>
              )}

              {/* Part Details Display Card */}
              {lastScannedPart ? (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {lastScannedPart.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          {lastScannedPart.sku}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {lastScannedPart.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Marca: <span className="text-slate-900 font-semibold">{lastScannedPart.brand}</span>
                        {lastScannedPart.oemCode && (
                          <span className="text-slate-500 ml-2 font-mono">
                            OEM: {lastScannedPart.oemCode}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500 font-medium">Stock Actual</div>
                      <div
                        className={`text-xl font-extrabold font-mono ${
                          lastScannedPart.quantity <= lastScannedPart.minStock
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {lastScannedPart.quantity} {lastScannedPart.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mínimo: {lastScannedPart.minStock}
                      </div>
                    </div>
                  </div>

                  {/* Shelving Location Highlight Banner */}
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Ubicación en Almacén
                        </div>
                        <div className="text-base font-black text-blue-600 font-mono tracking-tight">
                          {lastScannedPart.location.binCode}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Estantería {lastScannedPart.location.rack} • Fila {lastScannedPart.location.row} • Canasta {lastScannedPart.location.column}
                        </div>
                      </div>
                    </div>

                    {lastScannedPart.location.binLabel && (
                      <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200 max-w-[120px] truncate font-medium">
                        {lastScannedPart.location.binLabel}
                      </span>
                    )}
                  </div>

                  {/* Price and Vehicles */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Precio Venta:</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        ${lastScannedPart.salePrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Vehículos compatibles:</span>
                      <span className="text-xs text-slate-800 truncate block font-medium">
                        {lastScannedPart.compatibleVehicles.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Barcode Visual Strip */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                    <svg ref={barcodeCanvasRef} className="max-w-full h-9" />
                  </div>

                  {/* Quick Action button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPartForInspection(lastScannedPart);
                      onClose();
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Ver Ficha Completa del Repuesto
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[220px]">
                  <div className="p-3 rounded-full bg-slate-200 text-slate-500">
                    <BarcodeIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Esperando lectura de código...
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Los datos del repuesto y su canasta asignada aparecerán aquí en tiempo real tras disparar la pistola.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Session Scan Log */}
          {recentScans.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Historial de Lecturas en esta Sesión ({recentScans.length})
                </span>
                <button
                  type="button"
                  onClick={() => setRecentScans([])}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Limpiar lista
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentScans.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-700"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          evt.success ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-slate-400 text-[10px]">{evt.timestamp}</span>
                      <span className="text-slate-800 font-medium truncate">{evt.message}</span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 shrink-0 ml-2">
                      {evt.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Lector listo para escanear en cualquier momento
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition-colors shadow-xs"
          >
            Cerrar Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
