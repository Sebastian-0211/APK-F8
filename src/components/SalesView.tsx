import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  Eye,
  Printer,
  Sparkles,
  Layers,
  ArrowUpRight,
  Package
} from 'lucide-react';
import { SaleInvoice, InvoiceType, PaymentMethod, AppUser } from '../types';

interface SalesViewProps {
  sales: SaleInvoice[];
  currentUser?: AppUser;
  users?: AppUser[];
  onOpenNewSale: () => void;
  onViewInvoice: (sale: SaleInvoice) => void;
  onCancelSale: (saleId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  currentUser,
  users = [],
  onOpenNewSale,
  onViewInvoice,
  onCancelSale,
}) => {
  const canCreateInvoices = currentUser ? currentUser.permissions.createInvoices : true;
  const canViewFinancials = currentUser ? currentUser.permissions.viewFinancials : true;
  const canVoidSales = currentUser ? currentUser.permissions.voidSales : true;

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sellerFilter, setSellerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract distinct available months from sales data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    sales.forEach((s) => {
      const date = new Date(s.createdAt);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(yearMonth);
    });

    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted;
  }, [sales]);

  // Set default month to most recent if available
  const activeMonthValue = selectedMonth === 'ALL' && availableMonths.length > 0
    ? availableMonths[0]
    : selectedMonth;

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const d = new Date(s.createdAt);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (ym !== selectedMonth) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && s.type !== typeFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'ALL' && s.paymentMethod !== paymentFilter) {
        return false;
      }

      // Seller filter
      if (sellerFilter !== 'ALL' && s.sellerId !== sellerFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCustomer = s.customerName.toLowerCase().includes(q);
        const matchesDoc = s.customerDocument.toLowerCase().includes(q);
        const matchesNumber = s.invoiceNumber.toLowerCase().includes(q);
        const matchesItem = s.items.some(
          (it) => it.partName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        );
        if (!matchesCustomer && !matchesDoc && !matchesNumber && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [sales, selectedMonth, typeFilter, paymentFilter, searchQuery]);

  // Calculate monthly KPIs for the filtered dataset
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalSubtotal = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalTaxes = filteredSales.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalGrossProfit = filteredSales.reduce((sum, s) => sum + s.grossProfit, 0);
  const totalUnitsSold = filteredSales.reduce(
    (sum, s) => sum + s.items.reduce((itemSum, it) => itemSum + it.quantity, 0),
    0
  );
  const averageMargin = totalSubtotal > 0 ? (totalGrossProfit / totalSubtotal) * 100 : 0;
  const electronicCount = filteredSales.filter((s) => s.type === 'ELECTRONIC').length;
  const manualCount = filteredSales.filter((s) => s.type === 'MANUAL').length;

  const formatMonthLabel = (ym: string) => {
    if (ym === 'ALL') return 'Todo el Histórico';
    const [year, month] = ym.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Venta',
      'Factura',
      'Tipo',
      'Fecha',
      'Cliente',
      'Documento/NIT',
      'Email',
      'Items Vendidos',
      'Subtotal',
      'IVA',
      'Total',
      'Costo Total',
      'Ganancia Bruta',
      'Medio de Pago',
      'CUFE/Autorización',
    ];

    const rows = filteredSales.map((s) => [
      s.id,
      s.invoiceNumber,
      s.type === 'ELECTRONIC' ? 'Electrónica' : 'Manual',
      new Date(s.createdAt).toLocaleString(),
      `"${s.customerName.replace(/"/g, '""')}"`,
      `"${s.customerDocument}"`,
      s.customerEmail || '',
      `"${s.items.map((i) => `${i.quantity}x ${i.partName} [${i.sku}]`).join('; ')}"`,
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.total.toFixed(2),
      s.totalCost.toFixed(2),
      s.grossProfit.toFixed(2),
      s.paymentMethod,
      s.electronicDetails?.authorizationCode || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `reporte_ventas_autopart_${selectedMonth !== 'ALL' ? selectedMonth : 'completo'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">💵 Efectivo</span>;
      case 'CARD':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">💳 Tarjeta</span>;
      case 'TRANSFER':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">🏦 Transferencia</span>;
      case 'CREDIT':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold">📑 Crédito</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Otro</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Primary Actions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Registro de Ventas Mensuales & Facturación
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-mono font-bold">
              Facturación DIAN/POS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de comprobantes manuales y electrónicos, control fiscal y auditoría de despacho
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          {canCreateInvoices && (
            <button
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Venta / Facturar</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Financial Metrics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Facturado */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 transition-colors col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Total Facturado
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            IVA: <span className="font-semibold text-slate-700 font-mono">${totalTaxes.toFixed(2)}</span>
          </div>
        </div>

        {/* Ganancia Bruta Neta */}
        {canViewFinancials ? (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-400 transition-colors">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
              Ganancia Bruta
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 font-mono">
              +${totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1">
              Utilidad en repuestos
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Utilidad Neta</span>
            <div className="text-xs font-bold text-slate-500 mt-1">🔒 Restringido por Perfil</div>
          </div>
        )}

        {/* Margen Promedio */}
        {canViewFinancials ? (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 transition-colors">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
              Margen Promedio
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5 font-mono">
              {averageMargin.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Rentabilidad sobre costo
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Margen</span>
            <div className="text-xs font-bold text-slate-500 mt-1">🔒 Restringido por Perfil</div>
          </div>
        )}

        {/* Comprobantes Emitidos */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-400 transition-colors">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Facturas Emitidas
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
            {filteredSales.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {electronicCount} Electrónicas • {manualCount} Manuales
          </div>
        </div>

        {/* Unidades Vendidas */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-400 transition-colors">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Piezas Despachadas
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
            {totalUnitsSold} <span className="text-xs font-normal text-slate-500 font-sans">unid.</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Salidas de almacén
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Month Selector */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
            Periodo / Mes
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs capitalize"
          >
            <option value="ALL">📅 Todos los Meses / Histórico</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                📅 {formatMonthLabel(ym)}
              </option>
            ))}
          </select>
        </div>

        {/* Invoice Type Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
            Tipo de Factura
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
          >
            <option value="ALL">Todas las Facturas</option>
            <option value="ELECTRONIC">🛡️ Facturas Electrónicas (DIAN)</option>
            <option value="MANUAL">📄 Facturas Manuales / Talonario</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
            Medio de Pago
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
          >
            <option value="ALL">Todos los Medios de Pago</option>
            <option value="CASH">💵 Solo Efectivo</option>
            <option value="CARD">💳 Solo Tarjetas</option>
            <option value="TRANSFER">🏦 Solo Transferencias</option>
            <option value="CREDIT">📑 Solo Crédito</option>
          </select>
        </div>

        {/* Seller / User Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
            Vendedor / Asesor
          </label>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs"
          >
            <option value="ALL">👤 Todos los Asesores</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 font-mono mb-1">
            Buscar Cliente / Factura
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none shadow-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Listado de Comprobantes ({filteredSales.length})
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Periodo: {formatMonthLabel(selectedMonth)}
            </span>
          </div>
        </div>

        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4 font-mono">No. Factura</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Cliente / Receptor</th>
                  <th className="py-3 px-3">Asesor / Vendedor</th>
                  <th className="py-3 px-3">Repuestos / Canastas</th>
                  <th className="py-3 px-3">Pago</th>
                  <th className="py-3 px-3 text-right">Total ($)</th>
                  {canViewFinancials && <th className="py-3 px-3 text-right font-mono">Ganancia</th>}
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSales.map((sale) => {
                  const isElec = sale.type === 'ELECTRONIC';
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewInvoice(sale)}
                          className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>{sale.invoiceNumber}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                        <div className="text-slate-400 text-[10px]">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Invoice Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isElec
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isElec ? <ShieldCheck className="w-3 h-3 text-blue-600" /> : <FileText className="w-3 h-3 text-amber-600" />}
                          {isElec ? 'ELECTRÓNICA' : 'MANUAL'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 max-w-[180px]">
                        <div className="font-bold text-slate-900 truncate">{sale.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{sale.customerDocument}</div>
                      </td>

                      {/* Seller Tag */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold">
                          <span>👤</span>
                          <span>{sale.sellerName || 'Administrador'}</span>
                        </div>
                        {sale.sellerRole && (
                          <div className="text-[10px] text-slate-400 font-mono ml-0.5">
                            {sale.sellerRole}
                          </div>
                        )}
                      </td>

                      {/* Items Summary & Baskets */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="text-slate-800 text-xs truncate">
                          {sale.items.map((it) => `${it.quantity}x ${it.partName}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-blue-700 font-mono mt-0.5 flex flex-wrap gap-1">
                          {sale.items.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="bg-blue-50 px-1 py-0.2 rounded border border-blue-100">
                              {it.locationBin}
                            </span>
                          ))}
                          {sale.items.length > 2 && (
                            <span className="text-slate-400">+{sale.items.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPaymentBadge(sale.paymentMethod)}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        ${sale.total.toFixed(2)}
                      </td>

                      {/* Gross Profit */}
                      {canViewFinancials && (
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold whitespace-nowrap">
                          +${sale.grossProfit.toFixed(2)}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(sale)}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 shadow-xs transition-colors"
                            title="Ver / Imprimir Factura"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          {canVoidSales && (
                            <button
                              type="button"
                              onClick={() => onCancelSale(sale.id)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-300 shadow-xs transition-colors"
                              title="Anular Factura"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron ventas para los filtros seleccionados</p>
            <p className="text-xs text-slate-400">Prueba cambiando el mes seleccionado o emite una nueva factura.</p>
          </div>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600">
          <span className="font-mono">Total Comprobantes: {filteredSales.length}</span>
          <span className="font-mono font-bold text-slate-900">
            Suma Total Periodo: ${totalRevenue.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
