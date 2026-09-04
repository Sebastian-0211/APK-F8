import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Barcode as BarcodeIcon,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Printer,
  ChevronDown,
  Car,
  Package,
  Layers,
  Sparkles,
  Minus,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { AutoPart, PartCategory, RackConfig, AppUser } from '../types';

interface InventoryViewProps {
  parts: AutoPart[];
  racks: RackConfig[];
  currentUser?: AppUser;
  onOpenCreate: () => void;
  onEditPart: (part: AutoPart) => void;
  onDeletePart: (partId: string) => void;
  onInspectPart: (part: AutoPart) => void;
  onPrintPartBarcode: (part: AutoPart) => void;
  onQuickStockChange: (partId: string, delta: number) => void;
  onOpenManualDispatch?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  parts,
  racks,
  currentUser,
  onOpenCreate,
  onEditPart,
  onDeletePart,
  onInspectPart,
  onPrintPartBarcode,
  onQuickStockChange,
  onOpenManualDispatch,
}) => {
  const canViewFinancials = currentUser ? currentUser.permissions.viewFinancials : true;
  const canManageInventory = currentUser ? currentUser.permissions.manageInventory : true;
  const canManualAdjust = currentUser ? currentUser.permissions.manualStockAdjust : true;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRack, setSelectedRack] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'OK'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'location'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories: PartCategory[] = [
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

  // Filtered and Sorted Parts
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = part.name.toLowerCase().includes(q);
        const matchesSku = part.sku.toLowerCase().includes(q);
        const matchesBarcode = part.barcode.toLowerCase().includes(q);
        const matchesBrand = part.brand.toLowerCase().includes(q);
        const matchesOem = part.oemCode?.toLowerCase().includes(q) || false;
        const matchesBin = part.location.binCode.toLowerCase().includes(q);
        const matchesVehicle = (part.compatibleVehicles || []).some((v) =>
          v && typeof v === 'string' && v.toLowerCase().includes(q)
        );

        if (
          !matchesName &&
          !matchesSku &&
          !matchesBarcode &&
          !matchesBrand &&
          !matchesOem &&
          !matchesBin &&
          !matchesVehicle
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && part.category !== selectedCategory) {
        return false;
      }

      // Rack filter
      if (selectedRack !== 'ALL' && part.location.rack !== parseInt(selectedRack, 10)) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter === 'LOW') {
        if (part.quantity > part.minStock || part.quantity === 0) return false;
      } else if (stockStatusFilter === 'OUT') {
        if (part.quantity > 0) return false;
      } else if (stockStatusFilter === 'OK') {
        if (part.quantity <= part.minStock) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'stock') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'price') {
        comparison = a.salePrice - b.salePrice;
      } else if (sortBy === 'location') {
        comparison = a.location.binCode.localeCompare(b.location.binCode);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [parts, searchQuery, selectedCategory, selectedRack, stockStatusFilter, sortBy, sortOrder]);

  const lowStockCount = parts.filter((p) => p.quantity <= p.minStock && p.quantity > 0).length;
  const outOfStockCount = parts.filter((p) => p.quantity === 0).length;

  return (
    <div className="space-y-5">
      {/* Search, Filter & Quick Stats Toolbar */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, Código de Barras, SKU, OEM, Marca, Modelo de Carro (ej: Corolla)..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* New Part & Manual Dispatch Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenManualDispatch && (
              <button
                type="button"
                onClick={onOpenManualDispatch}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs"
                title="Despachar o ingresar material manualmente si no funciona la pistola"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Despacho Manual</span>
              </button>
            )}

            {canManageInventory && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Repuesto</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Category Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Rack Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Estantería
            </label>
            <select
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todas las Estanterías</option>
              {racks.map((r) => (
                <option key={r.rackNumber} value={r.rackNumber.toString()}>
                  Estantería {r.rackNumber} ({r.name})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Condition */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Estado de Existencias
            </label>
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="LOW">⚠️ Stock Bajo ({lowStockCount})</option>
              <option value="OUT">❌ Agotados ({outOfStockCount})</option>
              <option value="OK">✅ Con Stock Óptimo</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Ordenar por
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-2 focus:border-blue-600 focus:outline-none"
              >
                <option value="name">Nombre</option>
                <option value="stock">Stock Disponible</option>
                <option value="price">Precio de Venta</option>
                <option value="location">Ubicación (Canasta)</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 text-xs flex items-center justify-center transition-colors"
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Count and Active Filters Bar */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
        <span>
          Mostrando <strong className="text-slate-900">{filteredParts.length}</strong> de{' '}
          <strong className="text-slate-900">{parts.length}</strong> repuestos registrados
        </span>
        {(selectedCategory !== 'ALL' || selectedRack !== 'ALL' || stockStatusFilter !== 'ALL' || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedRack('ALL');
              setStockStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="text-blue-600 hover:underline font-bold"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* Parts Table & Mobile Cards */}
      {filteredParts.length > 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
                  <th className="py-3.5 px-4">Repuesto / Marca</th>
                  <th className="py-3.5 px-3">Código / SKU</th>
                  <th className="py-3.5 px-3">Ubicación (Canasta)</th>
                  <th className="py-3.5 px-3">Vehículos</th>
                  <th className="py-3.5 px-3 text-right">Precio Venta</th>
                  <th className="py-3.5 px-3 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredParts.map((part) => {
                  const isLow = part.quantity <= part.minStock && part.quantity > 0;
                  const isOut = part.quantity === 0;

                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Name & Category */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                {part.category}
                              </span>
                              <span className="text-slate-800 font-bold text-xs">
                                {part.brand}
                              </span>
                            </div>
                            <h4
                              onClick={() => onInspectPart(part)}
                              className="text-slate-900 font-bold text-xs hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {part.name}
                            </h4>
                            {part.oemCode && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                OEM: {part.oemCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Barcode & SKU */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="text-slate-900 font-bold text-xs">{part.sku}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <BarcodeIcon className="w-3 h-3 text-blue-600" />
                          {part.barcode}
                        </div>
                      </td>

                      {/* Location Bin Code */}
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                          {part.location.binCode}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Est.{part.location.rack} • Fila {part.location.row} • Col {part.location.column}
                        </div>
                      </td>

                      {/* Compatible Vehicles */}
                      <td className="py-3.5 px-3 max-w-[170px]">
                        <div className="text-[11px] text-slate-700 truncate" title={(part.compatibleVehicles || []).join(', ')}>
                          {(part.compatibleVehicles || []).slice(0, 2).join(', ')}
                        </div>
                        {(part.compatibleVehicles?.length || 0) > 2 && (
                          <div className="text-[10px] text-slate-400">
                            +{(part.compatibleVehicles?.length || 0) - 2} modelos más
                          </div>
                        )}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="text-emerald-600 font-bold text-sm">
                          ${part.salePrice.toFixed(2)}
                        </div>
                        {canViewFinancials && (
                          <div className="text-[10px] text-slate-400">
                            Costo: ${part.costPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock & Quick +/- Buttons */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            {canManualAdjust && (
                              <button
                                type="button"
                                onClick={() => onQuickStockChange(part.id, -1)}
                                disabled={part.quantity <= 0}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors"
                                title="Despachar 1 unidad"
                              >
                                -
                              </button>
                            )}
                            <span
                              className={`text-sm font-extrabold font-mono min-w-[28px] ${
                                isOut
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-slate-900'
                              }`}
                            >
                              {part.quantity}
                            </span>
                            {canManualAdjust && (
                              <button
                                type="button"
                                onClick={() => onQuickStockChange(part.id, 1)}
                                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors"
                                title="Ingresar 1 unidad"
                              >
                                +
                              </button>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {part.unit} (Mín: {part.minStock})
                          </span>

                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Stock Bajo
                            </span>
                          )}
                          {isOut && (
                            <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                              ¡Agotado!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPrintPartBarcode(part)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Imprimir código de barras"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onInspectPart(part)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManageInventory && (
                            <>
                              <button
                                type="button"
                                onClick={() => onEditPart(part)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Editar repuesto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeletePart(part.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Eliminar repuesto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Shown on mobile devices) */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredParts.map((part) => {
              const isLow = part.quantity <= part.minStock && part.quantity > 0;
              const isOut = part.quantity === 0;

              return (
                <div
                  key={part.id}
                  className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {part.category}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{part.brand}</span>
                      </div>
                      <h4
                        onClick={() => onInspectPart(part)}
                        className="text-sm font-bold text-slate-900"
                      >
                        {part.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        SKU: <span className="text-slate-800 font-medium">{part.sku}</span> | Barcode: {part.barcode}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold font-mono text-emerald-600">
                        ${part.salePrice.toFixed(2)}
                      </div>
                      {canViewFinancials && (
                        <div className="text-[10px] text-slate-400">
                          Costo: ${part.costPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Stock Badges */}
                  <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono font-bold">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      {part.location.binCode}
                    </div>

                    <div className="flex items-center gap-2">
                      {canManualAdjust && (
                        <button
                          type="button"
                          onClick={() => onQuickStockChange(part.id, -1)}
                          disabled={part.quantity <= 0}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                      )}
                      <span
                        className={`text-sm font-extrabold font-mono ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                        }`}
                      >
                        {part.quantity} {part.unit}
                      </span>
                      {canManualAdjust && (
                        <button
                          type="button"
                          onClick={() => onQuickStockChange(part.id, 1)}
                          className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => onPrintPartBarcode(part)}
                      className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      Etiqueta
                    </button>
                    <button
                      type="button"
                      onClick={() => onInspectPart(part)}
                      className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Detalles
                    </button>
                    {canManageInventory && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditPart(part)}
                          className="text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePart(part.id)}
                          className="text-slate-500 hover:text-rose-600 flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron repuestos
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay ningún repuesto que coincida con los filtros o la búsqueda ingresada.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedRack('ALL');
              setStockStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-600 text-xs font-bold rounded-lg transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      )}
    </div>
  );
};
