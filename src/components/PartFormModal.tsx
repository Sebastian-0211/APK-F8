import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Barcode as BarcodeIcon,
  MapPin,
  Car,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ScanLine
} from 'lucide-react';
import { AutoPart, PartCategory, RackConfig } from '../types';
import { formatBinCode, generateRandomBarcode, generateSKU } from '../utils/barcode';

interface PartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: Omit<AutoPart, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  initialPart?: AutoPart | null;
  racks: RackConfig[];
  initialBarcode?: string;
  initialLocation?: { rack: number; row: number; column: number };
}

const CATEGORIES: PartCategory[] = [
  'Frenos',
  'Motor y Componentes',
  'Filtros y Lubricantes',
  'Suspensión y Dirección',
  'Transmisión y Embrague',
  'Sistema Eléctrico e Iluminación',
  'Refrigeración y Clima',
  'Carrocería y Accesorios',
  'Otros',
];

const COMMON_BRANDS = [
  'Bosch',
  'Brembo',
  'Denso',
  'NGK',
  'Mann Filter',
  'Monroe',
  'Gates',
  'LuK',
  'SKF',
  'ACDelco',
  'Mobil',
  'Aisin',
  'Moog',
  'Valeo',
  'KyB',
];

export const PartFormModal: React.FC<PartFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPart,
  racks,
  initialBarcode,
  initialLocation,
}) => {
  const [barcode, setBarcode] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [oemCode, setOemCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [brand, setBrand] = useState<string>('Bosch');
  const [category, setCategory] = useState<PartCategory>('Frenos');
  const [vehicleInput, setVehicleInput] = useState<string>('');
  const [compatibleVehicles, setCompatibleVehicles] = useState<string[]>([]);
  
  // Location
  const [rack, setRack] = useState<number>(1);
  const [row, setRow] = useState<number>(1);
  const [column, setColumn] = useState<number>(1);
  const [binLabel, setBinLabel] = useState<string>('');

  // Stock & Prices
  const [quantity, setQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(3);
  const [costPrice, setCostPrice] = useState<number>(15.0);
  const [salePrice, setSalePrice] = useState<number>(28.0);
  const [unit, setUnit] = useState<string>('Unidades');
  const [notes, setNotes] = useState<string>('');

  // Populate data
  useEffect(() => {
    if (initialPart) {
      setBarcode(initialPart.barcode);
      setSku(initialPart.sku);
      setOemCode(initialPart.oemCode || '');
      setName(initialPart.name);
      setBrand(initialPart.brand);
      setCategory(initialPart.category);
      setCompatibleVehicles(initialPart.compatibleVehicles || []);
      setRack(initialPart.location.rack);
      setRow(initialPart.location.row);
      setColumn(initialPart.location.column);
      setBinLabel(initialPart.location.binLabel || '');
      setQuantity(initialPart.quantity);
      setMinStock(initialPart.minStock);
      setCostPrice(initialPart.costPrice);
      setSalePrice(initialPart.salePrice);
      setUnit(initialPart.unit);
      setNotes(initialPart.notes || '');
    } else {
      // New part default
      const defaultRack = initialLocation?.rack || racks[0]?.rackNumber || 1;
      const defaultRow = initialLocation?.row || 1;
      const defaultCol = initialLocation?.column || 1;
      
      const newBarcode = initialBarcode || generateRandomBarcode('750');
      setBarcode(newBarcode);
      setSku(generateSKU('Frenos', defaultRack));
      setOemCode('');
      setName('');
      setBrand('Bosch');
      setCategory('Frenos');
      setCompatibleVehicles(['Toyota Corolla 2014-2022']);
      setRack(defaultRack);
      setRow(defaultRow);
      setColumn(defaultCol);
      setBinLabel('');
      setQuantity(10);
      setMinStock(3);
      setCostPrice(15.0);
      setSalePrice(28.0);
      setUnit('Unidades');
      setNotes('');
    }
  }, [initialPart, initialBarcode, initialLocation, racks, isOpen]);

  // Selected rack configuration to bound rows/columns
  const selectedRackObj = racks.find((r) => r.rackNumber === rack) || racks[0];
  const maxRows = selectedRackObj?.totalRows || 4;
  const maxCols = selectedRackObj?.totalCols || 5;

  const currentBinCode = formatBinCode(rack, row, column);

  const handleAddVehicle = () => {
    if (!vehicleInput.trim()) return;
    if (!compatibleVehicles.includes(vehicleInput.trim())) {
      setCompatibleVehicles([...compatibleVehicles, vehicleInput.trim()]);
    }
    setVehicleInput('');
  };

  const handleRemoveVehicle = (index: number) => {
    setCompatibleVehicles(compatibleVehicles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim() || !sku.trim()) return;

    const partData: Omit<AutoPart, 'id' | 'createdAt' | 'updatedAt'> = {
      barcode: barcode.trim(),
      sku: sku.trim(),
      oemCode: oemCode.trim() || undefined,
      name: name.trim(),
      brand: brand.trim(),
      category,
      compatibleVehicles: compatibleVehicles.length > 0 ? compatibleVehicles : ['Universal / Multi-modelo'],
      location: {
        rack,
        row,
        column,
        binCode: currentBinCode,
        binLabel: binLabel.trim() || undefined,
      },
      quantity: Math.max(0, Number(quantity) || 0),
      minStock: Math.max(1, Number(minStock) || 1),
      costPrice: Math.max(0, Number(costPrice) || 0),
      salePrice: Math.max(0, Number(salePrice) || 0),
      unit,
      notes: notes.trim() || undefined,
    };

    onSave(partData, initialPart?.id);
    onClose();
  };

  if (!isOpen) return null;

  const margin = salePrice > 0 ? Math.round(((salePrice - costPrice) / salePrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {initialPart ? 'Editar Repuesto' : 'Registrar Nuevo Repuesto de Carro'}
              </h2>
              <p className="text-xs text-slate-500">
                Asignación de código de barras y ubicación en estantería/canasta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Identification & Barcode */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 font-mono">
              <BarcodeIcon className="w-3.5 h-3.5" />
              1. Identificación y Códigos del Producto
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Barcode with generation / gun helper */}
              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Código de Barras (EAN / Code128) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setBarcode(generateRandomBarcode('750'))}
                    className="text-[11px] text-blue-600 font-bold hover:underline font-mono"
                  >
                    + Generar código
                  </button>
                </div>
                <div className="relative">
                  <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej: 7501001002011"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* SKU */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  SKU Interno *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: REP-FRE-E1-101"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                />
              </div>

              {/* OEM Code */}
              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Código OEM (Fabricante)
                </label>
                <input
                  type="text"
                  placeholder="ej: 04465-02220"
                  value={oemCode}
                  onChange={(e) => setOemCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Name, Brand & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-6">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre del Repuesto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Pastillas de Freno Delanteras Cerámicas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  list="common-brands"
                  required
                  placeholder="ej: Bosch"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
                />
                <datalist id="common-brands">
                  {COMMON_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Categoría *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PartCategory)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Storage Structure (Shelving / Basket Location) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5" />
                2. Ubicación en Estantería de Canastas
              </div>
              <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Código: {currentBinCode}
              </div>
            </div>

            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Rack selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Estantería (Módulo) *
                </label>
                <select
                  value={rack}
                  onChange={(e) => {
                    const nextRack = parseInt(e.target.value, 10);
                    setRack(nextRack);
                    // Adjust row/col bounds
                    const targetRack = racks.find((r) => r.rackNumber === nextRack);
                    if (targetRack) {
                      if (row > targetRack.totalRows) setRow(1);
                      if (column > targetRack.totalCols) setColumn(1);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:border-blue-600 focus:outline-none"
                >
                  {racks.map((r) => (
                    <option key={r.rackNumber} value={r.rackNumber}>
                      Estantería #{r.rackNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row (Fila / Nivel) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Fila (Nivel 1 a {maxRows}) *
                </label>
                <select
                  value={row}
                  onChange={(e) => setRow(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:border-blue-600 focus:outline-none"
                >
                  {Array.from({ length: maxRows }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Fila {i + 1} (F{i + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Column (Columna / Canasta) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Canasta (Columna 1 a {maxCols}) *
                </label>
                <select
                  value={column}
                  onChange={(e) => setColumn(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:border-blue-600 focus:outline-none"
                >
                  {Array.from({ length: maxCols }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Canasta {i + 1} (C{i + 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bin label */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Etiqueta Opcional
                </label>
                <input
                  type="text"
                  placeholder="ej: Canasta Rápida"
                  value={binLabel}
                  onChange={(e) => setBinLabel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Stock, Quantities and Prices */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 font-mono">
              <DollarSign className="w-3.5 h-3.5" />
              3. Existencias, Precios y Unidades
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Current Quantity */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Stock Inicial *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>

              {/* Min Stock */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Stock Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={minStock}
                  onChange={(e) => setMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Unidades">Unidades</option>
                  <option value="Juegos">Juegos</option>
                  <option value="Kits">Kits</option>
                  <option value="Pares">Pares</option>
                  <option value="Litros">Litros</option>
                </select>
              </div>

              {/* Cost Price */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Precio Costo ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>

              {/* Sale Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Precio Venta ($) *
                  </label>
                  {margin > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      +{margin}%
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Vehicle Compatibility Tags */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 font-mono">
              <Car className="w-3.5 h-3.5" />
              4. Compatibilidad con Vehículos
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ej: Toyota Corolla 2014-2022, Chevrolet Aveo 1.6..."
                value={vehicleInput}
                onChange={(e) => setVehicleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVehicle();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddVehicle}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-xs"
              >
                + Añadir Modelo
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {compatibleVehicles.map((vehicle, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-semibold"
                >
                  <Car className="w-3 h-3 text-blue-600" />
                  {vehicle}
                  <button
                    type="button"
                    onClick={() => handleRemoveVehicle(idx)}
                    className="hover:text-rose-600 ml-1 text-slate-400 hover:font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Notas Adicionales / Especificaciones Técnicas
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre especificaciones, medidas, empaque o advertencias de instalación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              {initialPart ? 'Actualizar Repuesto' : 'Guardar en Inventario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
