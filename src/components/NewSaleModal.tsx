import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  ScanLine,
  Search,
  Plus,
  Trash2,
  Receipt,
  FileText,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Camera,
  CameraOff,
  MapPin,
  Sparkles,
  Zap,
  RotateCcw,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AutoPart,
  SaleInvoice,
  SaleItem,
  InvoiceType,
  PaymentMethod,
  AppUser,
  UserRole
} from '../types';
import { soundManager } from '../utils/audio';
import { useBarcodeGun } from '../hooks/useBarcodeGun';
import { NumberInput } from './common/NumberInput';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
  currentUser?: AppUser;
  users?: AppUser[];
  roles?: UserRole[];
  onCompleteSale: (sale: SaleInvoice) => void;
  onOpenScannerCamera?: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  parts,
  currentUser,
  users = [],
  roles = [],
  onCompleteSale,
}) => {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('ELECTRONIC');
  const [manualNumber, setManualNumber] = useState<string>('');
  
  // Seller details
  const [selectedSellerId, setSelectedSellerId] = useState<string>(currentUser?.id || '');

  // Customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerDocument, setCustomerDocument] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Items in the cart
  const [items, setItems] = useState<SaleItem[]>([]);

  // Financial details
  const [taxPercent, setTaxPercent] = useState<number>(19);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState<string>('');

  // Barcode / SKU quick search input
  const [quickCodeInput, setQuickCodeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AutoPart[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera & Barcode Gun Scanner States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isContinuousCamera, setIsContinuousCamera] = useState<boolean>(true);
  const [lastScanNotice, setLastScanNotice] = useState<{
    name: string;
    barcode: string;
    source: 'GUN' | 'CAMERA';
    time: string;
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'sale-camera-scanner-viewport';
  const lastScanTimeRef = useRef<number>(0);

  // Generate default manual number or electronic invoice number
  useEffect(() => {
    if (isOpen) {
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      setManualNumber(`MAN-001-00${randomSeq}`);
      setErrorMsg(null);
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const matches = parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.oemCode && p.oemCode.toLowerCase().includes(q))
    ).slice(0, 8);

    setSearchResults(matches);
    setIsSearching(true);
  }, [searchQuery, parts]);

  // Add Part to cart helper
  const addPartToCart = useCallback((part: AutoPart, qty: number = 1) => {
    setErrorMsg(null);

    setItems((prevItems) => {
      // Check available stock
      const existingIndex = prevItems.findIndex((item) => item.partId === part.id);
      const currentInCart = existingIndex >= 0 ? prevItems[existingIndex].quantity : 0;
      const requestedTotal = currentInCart + qty;

      if (requestedTotal > part.quantity) {
        setErrorMsg(
          `Stock insuficiente para "${part.name}". Disponible en canasta [${part.location.binCode}]: ${part.quantity} ${part.unit}.`
        );
        soundManager.playWarningBeep();
        return prevItems;
      }

      // Determine unit price (use promotionalPrice if active)
      const effectivePrice =
        part.promotionalPrice && part.promotionalPrice > 0
          ? part.promotionalPrice
          : part.salePrice;

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prevItems];
        const prev = updated[existingIndex];
        const newQty = prev.quantity + qty;
        const subtotal = newQty * prev.unitPrice * (1 - prev.discountPercent / 100);

        updated[existingIndex] = {
          ...prev,
          quantity: newQty,
          subtotal,
        };
        soundManager.playSuccessBeep();
        return updated;
      } else {
        // Add new item
        const newItem: SaleItem = {
          partId: part.id,
          partName: part.name,
          sku: part.sku,
          barcode: part.barcode,
          brand: part.brand,
          category: part.category,
          unit: part.unit,
          quantity: qty,
          unitPrice: effectivePrice,
          costPrice: part.costPrice,
          discountPercent: 0,
          subtotal: qty * effectivePrice,
          locationBin: part.location.binCode,
        };
        soundManager.playSuccessBeep();
        return [newItem, ...prevItems];
      }
    });

    setSearchQuery('');
    setQuickCodeInput('');
    setIsSearching(false);
  }, []);

  // Unified barcode scan processor for hardware gun and camera
  const handleScanCode = useCallback(
    (codeRaw: string, source: 'GUN' | 'CAMERA') => {
      const code = codeRaw.trim();
      if (!code) return;

      // Anti-duplicate debounce for camera scanner (1.2s)
      const now = Date.now();
      if (source === 'CAMERA' && now - lastScanTimeRef.current < 1200) {
        return;
      }
      lastScanTimeRef.current = now;

      const matched = parts.find(
        (p) =>
          p.barcode.toLowerCase() === code.toLowerCase() ||
          p.sku.toLowerCase() === code.toLowerCase() ||
          (p.oemCode && p.oemCode.toLowerCase() === code.toLowerCase())
      );

      if (matched) {
        addPartToCart(matched, 1);
        setLastScanNotice({
          name: matched.name,
          barcode: matched.barcode,
          source,
          time: new Date().toLocaleTimeString(),
        });
        if (source === 'CAMERA' && !isContinuousCamera) {
          setIsCameraActive(false);
        }
      } else {
        soundManager.playWarningBeep();
        setErrorMsg(
          `Código "${code}" leído por ${
            source === 'GUN' ? 'pistola lectora' : 'cámara'
          }, pero no se encontró en el inventario.`
        );
      }
    },
    [parts, isContinuousCamera, addPartToCart]
  );

  // Hardware Barcode Gun Integration (active while modal is open)
  const { isGunActive } = useBarcodeGun({
    onScan: (barcode) => handleScanCode(barcode, 'GUN'),
    enabled: isOpen,
  });

  // Camera Scanner Lifecycle
  useEffect(() => {
    let scanner: Html5Qrcode | null = null;

    if (isOpen && isCameraActive) {
      setCameraError(null);
      const timer = setTimeout(() => {
        try {
          scanner = new Html5Qrcode(scannerRegionId);
          html5QrCodeRef.current = scanner;

          const config = {
            fps: 15,
            qrbox: { width: 260, height: 160 },
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
                handleScanCode(decodedText, 'CAMERA');
              },
              () => {
                // Ignore frames without barcodes
              }
            )
            .catch((err) => {
              console.warn('Camera error:', err);
              setCameraError('No se pudo acceder a la cámara. Revisa permisos o usa la pistola lectora.');
              setIsCameraActive(false);
            });
        } catch (err: any) {
          setCameraError('Error al iniciar cámara: ' + (err?.message || err));
          setIsCameraActive(false);
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.stop().then(() => scanner?.clear()).catch(() => {});
        }
        html5QrCodeRef.current = null;
      };
    } else {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => html5QrCodeRef.current?.clear()).catch(() => {});
        html5QrCodeRef.current = null;
      }
    }
  }, [isOpen, isCameraActive, handleScanCode]);

  // Handle Quick Barcode scan / submit from hardware gun or manual enter
  const handleQuickCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim()) return;

    const code = quickCodeInput.trim().toLowerCase();
    const found = parts.find(
      (p) =>
        p.barcode.toLowerCase() === code ||
        p.sku.toLowerCase() === code ||
        (p.oemCode && p.oemCode.toLowerCase() === code)
    );

    if (found) {
      addPartToCart(found, 1);
      setQuickCodeInput('');
    } else {
      setErrorMsg(`No se encontró ningún repuesto con el código "${quickCodeInput}".`);
      soundManager.playWarningBeep();
    }
  };

  // Item quantity change
  const handleItemQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    const item = items[index];
    const sourcePart = parts.find((p) => p.id === item.partId);

    if (sourcePart && newQty > sourcePart.quantity) {
      setErrorMsg(
        `Solo hay ${sourcePart.quantity} ${sourcePart.unit} disponibles en ${sourcePart.location.binCode}.`
      );
      soundManager.playWarningBeep();
      return;
    }

    setErrorMsg(null);
    const updated = [...items];
    const subtotal = newQty * item.unitPrice * (1 - item.discountPercent / 100);
    updated[index] = { ...item, quantity: newQty, subtotal };
    setItems(updated);
  };

  // Item discount change
  const handleItemDiscountChange = (index: number, discount: number) => {
    const validDiscount = Math.min(100, Math.max(0, discount || 0));
    const updated = [...items];
    const item = updated[index];
    const subtotal = item.quantity * item.unitPrice * (1 - validDiscount / 100);
    updated[index] = { ...item, discountPercent: validDiscount, subtotal };
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const rawSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = Math.max(0, rawSubtotal - discountedSubtotal);
  const taxAmount = (discountedSubtotal * taxPercent) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const grossProfit = Math.max(0, discountedSubtotal - totalCost);

  // Submit Sale Invoice
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('Debes agregar al menos un repuesto a la factura.');
      soundManager.playWarningBeep();
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg('Por favor ingresa el nombre o razón social del cliente.');
      return;
    }

    const now = new Date().toISOString();
    const timestampDigits = Date.now().toString().slice(-6);

    let finalInvoiceNumber = '';
    let electronicDetails = undefined;

    if (invoiceType === 'ELECTRONIC') {
      finalInvoiceNumber = `FAC-E001-000${timestampDigits}`;
      const docClean = customerDocument.replace(/[^0-9]/g, '') || '900123456';
      const authKey = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}01${docClean.padEnd(10, '0')}2001001000${timestampDigits}1234567819`;
      electronicDetails = {
        authorizationCode: authKey,
        digitalStamp: `FE-AUTH-${timestampDigits}-DIAN-CERT-OK`,
        qrData: `https://factura-electronica.gov/valida?cufe=${authKey}`,
        emissionDate: now,
        resolutionNumber: 'RES-18764000129840',
        prefix: 'FAC-E001',
      };
    } else {
      finalInvoiceNumber = manualNumber.trim() || `MAN-001-00${timestampDigits}`;
    }

    const selectedSeller = users.find((u) => u.id === selectedSellerId) || currentUser;
    const sellerRoleObj = roles.find((r) => r.id === selectedSeller?.roleId);

    const newSaleInvoice: SaleInvoice = {
      id: 'sale-' + Date.now(),
      invoiceNumber: finalInvoiceNumber,
      type: invoiceType,
      status: 'PAID',
      sellerId: selectedSeller?.id || 'user-1',
      sellerName: selectedSeller?.name || 'Administrador',
      sellerRole: sellerRoleObj?.name || 'Vendedor',
      customerName: customerName.trim(),
      customerDocument: customerDocument.trim() || '222222222222 (Consumidor Final)',
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      items,
      subtotal: discountedSubtotal,
      taxPercent,
      taxAmount,
      discountTotal,
      total: grandTotal,
      totalCost,
      grossProfit,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdAt: now,
      electronicDetails,
    };

    // Confetti burst
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    onCompleteSale(newSaleInvoice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Nueva Venta & Facturación
              </h2>
              <p className="text-xs text-slate-500">
                Punto de venta y emisión con deducción automática de estanterías y canastas
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

        {/* Form Body */}
        <form onSubmit={handleSubmitSale} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Invoicing Mode Selector (Manual vs Electrónica) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
              1. Modalidad de Facturación
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Facturación Electrónica */}
              <button
                type="button"
                onClick={() => setInvoiceType('ELECTRONIC')}
                className={`p-3 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${
                  invoiceType === 'ELECTRONIC'
                    ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    invoiceType === 'ELECTRONIC' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Facturación Electrónica</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                      DIAN / SAT / SRI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Genera CUFE, firma digital, código QR y resolución fiscal automáticamente.
                  </p>
                </div>
              </button>

              {/* Facturación Manual / Física */}
              <button
                type="button"
                onClick={() => setInvoiceType('MANUAL')}
                className={`p-3 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${
                  invoiceType === 'MANUAL'
                    ? 'bg-amber-50 border-amber-600 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    invoiceType === 'MANUAL' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Facturación Manual / Física</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-bold">
                      Talonario
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Comprobante físico de mostrador con correlativo manual personalizable.
                  </p>
                </div>
              </button>
            </div>

            {invoiceType === 'MANUAL' && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Número de Factura / Talonario Manual
                </label>
                <input
                  type="text"
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  placeholder="ej: MAN-001-000850"
                  className="w-full sm:w-64 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-600 focus:outline-none shadow-xs"
                />
              </div>
            )}
          </div>

          {/* 2. Customer Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
              2. Datos del Cliente / Receptor
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Taller Mecánico Los Andes / Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Documento (NIT / RUC / Cédula / DNI)
                </label>
                <input
                  type="text"
                  placeholder="ej: NIT 900.458.123-1 / CC 71.392.410"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Email (Para Factura Electrónica)
                </label>
                <input
                  type="email"
                  placeholder="cliente@correo.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Teléfono / Móvil
                </label>
                <input
                  type="text"
                  placeholder="ej: +57 310 445 8899"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="ej: Av. Industrial 45 # 12-30, Medellín"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>

              {/* Asesor / Vendedor Responsable */}
              {users.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Asesor / Vendedor Responsable:</span>
                    <span className="text-[11px] text-slate-500">Se computará para la estadística de ventas y ranking</span>
                  </div>
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  >
                    {users.map((u) => {
                      const r = roles.find((role) => role.id === u.roleId);
                      return (
                        <option key={u.id} value={u.id}>
                          👤 {u.name} ({r?.name || 'Vendedor'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. Part Scanner & Cart Line Items */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
                3. Repuestos & Productos Facturados ({items.length})
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {/* Hardware Barcode Gun Indicator */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    isGunActive
                      ? 'bg-emerald-500 text-white animate-pulse shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  }`}
                  title="Pistola lectora activa y lista. Simplemente dispara al código de barras del producto."
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  {isGunActive ? '🔫 Disparo de Pistola Detectado!' : '🔫 Pistola Lectora Lista'}
                </span>

                {/* Camera Scanner Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsCameraActive((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    isCameraActive
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff className="w-3.5 h-3.5" />
                      Cerrar Cámara
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      Escanear con Cámara
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Embedded Camera Viewfinder when enabled */}
            {isCameraActive && (
              <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3 shadow-lg border-2 border-blue-500 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold font-mono">
                      Cámara Lectora Activa • Apunta al código de barras del repuesto
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isContinuousCamera}
                        onChange={(e) => setIsContinuousCamera(e.target.checked)}
                        className="rounded text-blue-500"
                      />
                      Escaneo continuo
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(false)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Html5Qrcode container */}
                <div className="relative mx-auto max-w-md overflow-hidden rounded-lg bg-black border border-slate-700 aspect-video flex items-center justify-center">
                  <div id={scannerRegionId} className="w-full h-full" />
                </div>

                {cameraError && (
                  <div className="p-2 bg-rose-900/80 border border-rose-500 rounded text-rose-200 text-xs text-center">
                    {cameraError}
                  </div>
                )}
              </div>
            )}

            {/* Last Scanned Notice Flash */}
            {lastScanNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ✓ <strong>{lastScanNotice.source === 'GUN' ? 'Pistola' : 'Cámara'}:</strong> Se agregó{' '}
                    <strong>{lastScanNotice.name}</strong> ({lastScanNotice.barcode}) a la factura.
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-mono shrink-0">
                  {lastScanNotice.time}
                </span>
              </div>
            )}

            {/* Quick barcode search & catalog picker bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Barcode scanner input */}
              <div className="sm:col-span-5 relative">
                <form onSubmit={handleQuickCodeSubmit} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <ScanLine className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Escanear Código / Barcode..."
                      value={quickCodeInput}
                      onChange={(e) => setQuickCodeInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0"
                  >
                    Agregar
                  </button>
                </form>
              </div>

              {/* Text search input */}
              <div className="sm:col-span-7 relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, SKU, marca (ej: Brembo, Pastillas, Corolla)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {isSearching && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border-2 border-slate-300 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map((part) => (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => addPartToCart(part, 1)}
                        className="w-full p-2.5 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between text-left transition-colors text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{part.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {part.brand} • {part.sku} • Stock: <span className="font-bold text-slate-800">{part.quantity} {part.unit}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-blue-600">
                            ${(part.promotionalPrice || part.salePrice).toFixed(2)}
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                            {part.location.binCode}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart items list */}
            {items.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Repuesto / Marca</th>
                      <th className="py-2.5 px-3 font-mono">Canasta</th>
                      <th className="py-2.5 px-3 text-center">Cant</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit</th>
                      <th className="py-2.5 px-3 text-center">Desc %</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.partName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.brand} • {item.sku}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono">
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.locationBin}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center border border-slate-300 rounded-md bg-white shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(idx, item.quantity - 1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              -
                            </button>
                            <NumberInput
                              min={1}
                              max={parts.find((p) => p.id === item.partId)?.quantity || 999}
                              value={item.quantity}
                              onChange={(val) => handleItemQtyChange(idx, val)}
                              fallbackValue={1}
                              className="w-12 text-center text-xs font-mono font-bold text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(idx, item.quantity + 1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                          ${item.unitPrice.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <NumberInput
                            min={0}
                            max={100}
                            step={1}
                            value={item.discountPercent}
                            placeholder="0"
                            onChange={(val) => handleItemDiscountChange(idx, val)}
                            fallbackValue={0}
                            className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${item.subtotal.toFixed(2)}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Eliminar repuesto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl text-center text-slate-400 space-y-1">
                <ScanLine className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No hay repuestos agregados a la factura</p>
                <p className="text-[11px] text-slate-400">Escanea con la pistola o busca arriba para despachar piezas</p>
              </div>
            )}
          </div>

          {/* 4. Payment & Tax Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
                4. Forma de Pago & Impuesto
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                >
                  <option value="CASH">💵 Efectivo / Caja Mostrador</option>
                  <option value="CARD">💳 Tarjeta Débito / Crédito / Datáfono</option>
                  <option value="TRANSFER">🏦 Transferencia Bancaria</option>
                  <option value="CREDIT">📑 Crédito Comercial a Plazos</option>
                  <option value="OTHER">🔄 Otro Medio de Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Tasa de IVA / Impuesto (%)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 12, 16, 19, 21].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTaxPercent(pct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                          taxPercent === pct
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <NumberInput
                      min={0}
                      max={100}
                      step={1}
                      value={taxPercent}
                      onChange={(val) => setTaxPercent(val)}
                      fallbackValue={19}
                      className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-center focus:border-blue-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 font-mono">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="ej: Despacho a domicilio o garantía 6 meses"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              </div>
            </div>

            {/* Live Totals summary box */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Bruto:</span>
                  <span>${rawSubtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Descuentos Totales:</span>
                    <span>-${discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Base Imponible:</span>
                  <span>${discountedSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA ({taxPercent}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200 font-sans">
                  <span>TOTAL A COBRAR:</span>
                  <span className="font-mono text-lg text-blue-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {currentUser?.permissions?.viewFinancials !== false ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800 flex items-center justify-between">
                  <span>Ganancia Neta Estimada:</span>
                  <span className="font-bold">+${grossProfit.toFixed(2)}</span>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Margen / Costo:</span>
                  <span className="font-bold">🔒 Restringido por Perfil</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Factura y Despachar Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
