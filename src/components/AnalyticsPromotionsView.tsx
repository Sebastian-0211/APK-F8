import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Tag,
  Award,
  AlertCircle,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  Flame,
  Clock,
  Percent,
  X,
  Users,
  Trophy,
  Crown,
  Medal,
  Target,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AutoPart, SaleInvoice, Promotion, AppUser } from '../types';
import { soundManager } from '../utils/audio';

interface AnalyticsPromotionsViewProps {
  parts: AutoPart[];
  sales: SaleInvoice[];
  promotions: Promotion[];
  currentUser?: AppUser;
  users?: AppUser[];
  onAddPromotion: (promo: Promotion) => void;
  onRemovePromotion: (promoId: string) => void;
  onTogglePromotion: (promoId: string, isActive: boolean) => void;
}

export const AnalyticsPromotionsView: React.FC<AnalyticsPromotionsViewProps> = ({
  parts,
  sales,
  promotions,
  currentUser,
  users = [],
  onAddPromotion,
  onRemovePromotion,
  onTogglePromotion,
}) => {
  const canViewFinancials = currentUser ? currentUser.permissions.viewFinancials : true;
  const canManagePromos = currentUser ? currentUser.permissions.manageInventory || currentUser.roleId === 'admin' || currentUser.roleId === 'owner' : true;
  // Modal for new promotion
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedPartIdForPromo, setSelectedPartIdForPromo] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [promoReason, setPromoReason] = useState<string>('Liquidación por baja rotación');
  const [promoDays, setPromoDays] = useState<number>(30);

  // 1. Calculate Product Sales Ranking
  const productSalesMap = useMemo(() => {
    const map = new Map<
      string,
      {
        partId: string;
        partName: string;
        sku: string;
        brand: string;
        category: string;
        locationBin: string;
        currentStock: number;
        salePrice: number;
        costPrice: number;
        unitsSold: number;
        totalRevenue: number;
        totalProfit: number;
      }
    >();

    // Initialize with all current inventory parts
    parts.forEach((p) => {
      map.set(p.id, {
        partId: p.id,
        partName: p.name,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        locationBin: p.location.binCode,
        currentStock: p.quantity,
        salePrice: p.promotionalPrice || p.salePrice,
        costPrice: p.costPrice,
        unitsSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
      });
    });

    // Accumulate all sales
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = map.get(item.partId);
        if (existing) {
          existing.unitsSold += item.quantity;
          existing.totalRevenue += item.subtotal;
          existing.totalProfit += item.subtotal - item.quantity * item.costPrice;
        } else {
          // In case it was sold previously and removed from stock
          map.set(item.partId, {
            partId: item.partId,
            partName: item.partName,
            sku: item.sku,
            brand: item.brand,
            category: item.category,
            locationBin: item.locationBin,
            currentStock: 0,
            salePrice: item.unitPrice,
            costPrice: item.costPrice,
            unitsSold: item.quantity,
            totalRevenue: item.subtotal,
            totalProfit: item.subtotal - item.quantity * item.costPrice,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [parts, sales]);

  // Top Most Sold Products (Top 5)
  const topSoldProducts = useMemo(() => {
    return [...productSalesMap]
      .filter((p) => p.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 6);
  }, [productSalesMap]);

  // Least Sold Products (Low rotation / 0 or minimal sales with stock sitting in baskets)
  const leastSoldProducts = useMemo(() => {
    return [...productSalesMap]
      .filter((p) => p.currentStock > 0) // still takes space in warehouse
      .sort((a, b) => {
        if (a.unitsSold !== b.unitsSold) {
          return a.unitsSold - b.unitsSold; // lowest sales first
        }
        return b.currentStock - a.currentStock; // most stock sitting first
      })
      .slice(0, 6);
  }, [productSalesMap]);

  // 2. Chart: Monthly Sales and Profit trend
  const monthlyData = useMemo(() => {
    const monthsObj: Record<string, { month: string; ventas: number; ganancia: number; facturas: number }> = {};

    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      if (!monthsObj[key]) {
        monthsObj[key] = { month: label, ventas: 0, ganancia: 0, facturas: 0 };
      }
      monthsObj[key].ventas += s.total;
      monthsObj[key].ganancia += s.grossProfit;
      monthsObj[key].facturas += 1;
    });

    const sortedKeys = Object.keys(monthsObj).sort();
    return sortedKeys.map((k) => monthsObj[k]);
  }, [sales]);

  // 3. Chart: Sales by Category
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const cat = it.category.split(' ')[0] || 'General';
        catMap[cat] = (catMap[cat] || 0) + it.subtotal;
      });
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sales]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // 4. Seller / Salesperson Performance Ranking
  const sellerLeaderboard = useMemo(() => {
    const sellerMap = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        sellerRole: string;
        invoicesCount: number;
        totalBilled: number;
        unitsSold: number;
        totalProfit: number;
        electronicInvoices: number;
        manualInvoices: number;
      }
    >();

    // Seed known users if provided
    users.forEach((u) => {
      sellerMap.set(u.id, {
        sellerId: u.id,
        sellerName: u.name,
        sellerRole: u.roleName,
        invoicesCount: 0,
        totalBilled: 0,
        unitsSold: 0,
        totalProfit: 0,
        electronicInvoices: 0,
        manualInvoices: 0,
      });
    });

    // Populate from all sales invoices
    sales.forEach((s) => {
      const sId = s.sellerId || 'usr-admin';
      const sName = s.sellerName || 'Administrador Principal';
      const sRole = s.sellerRole || 'Dueño / Administrador';

      let seller = sellerMap.get(sId);
      if (!seller) {
        seller = {
          sellerId: sId,
          sellerName: sName,
          sellerRole: sRole,
          invoicesCount: 0,
          totalBilled: 0,
          unitsSold: 0,
          totalProfit: 0,
          electronicInvoices: 0,
          manualInvoices: 0,
        };
        sellerMap.set(sId, seller);
      }

      seller.invoicesCount += 1;
      seller.totalBilled += s.total;
      seller.totalProfit += s.grossProfit;
      if (s.type === 'ELECTRONIC') seller.electronicInvoices += 1;
      else seller.manualInvoices += 1;

      const unitsInSale = s.items.reduce((sum, it) => sum + it.quantity, 0);
      seller.unitsSold += unitsInSale;
    });

    const list = Array.from(sellerMap.values());
    // Sort by total money billed descending, then invoice count
    list.sort((a, b) => {
      if (b.totalBilled !== a.totalBilled) return b.totalBilled - a.totalBilled;
      return b.invoicesCount - a.invoicesCount;
    });

    return list;
  }, [sales, users]);

  // Overall Total Billed for percentage calculations
  const grandTotalBilled = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  // Top seller of the period
  const topSeller = sellerLeaderboard.length > 0 && sellerLeaderboard[0].totalBilled > 0 ? sellerLeaderboard[0] : null;

  // Total stuck capital in least sold items
  const stuckCapital = leastSoldProducts.reduce(
    (sum, p) => sum + p.currentStock * p.costPrice,
    0
  );

  // Quick Open Promo creation modal for a specific part
  const handleOpenPromoForPart = (partId: string) => {
    setSelectedPartIdForPromo(partId);
    setDiscountPercent(20);
    setPromoReason('Oferta especial por baja rotación de canasta');
    setIsPromoModalOpen(true);
  };

  // Submit Promotion
  const handleCreatePromotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPart = parts.find((p) => p.id === selectedPartIdForPromo);
    if (!targetPart) return;

    const basePrice = targetPart.salePrice;
    const discounted = Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + promoDays);

    const newPromo: Promotion = {
      id: 'promo-' + Date.now(),
      partId: targetPart.id,
      partName: targetPart.name,
      sku: targetPart.sku,
      category: targetPart.category,
      originalPrice: basePrice,
      discountPercent,
      promotionalPrice: discounted,
      reason: promoReason.trim() || 'Promoción de Almacén',
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      isActive: true,
    };

    onAddPromotion(newPromo);
    soundManager.playSuccessBeep();
    setIsPromoModalOpen(false);
  };

  const selectedPartObj = parts.find((p) => p.id === selectedPartIdForPromo);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Estadísticas de Rotación & Módulo de Promociones
            </h1>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-mono font-bold">
              Business Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Análisis de piezas de alta y baja rotación para optimización de canastas y liquidación de inventario
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (parts.length > 0) {
              setSelectedPartIdForPromo(parts[0].id);
              setIsPromoModalOpen(true);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Crear Nueva Promoción</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Top Performer */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Repuesto Más Vendido (Top 1)
          </span>
          <div className="font-bold text-slate-900 mt-1 truncate text-sm sm:text-base">
            {topSoldProducts[0]?.partName || 'Sin ventas aún'}
          </div>
          <div className="text-xs text-blue-600 font-mono mt-0.5">
            {topSoldProducts[0]?.unitsSold || 0} unidades despachadas
          </div>
        </div>

        {/* Capital Inmovilizado */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Capital en Repuestos Estancados
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5 font-mono">
            ${stuckCapital.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            En canastas con baja/nula rotación
          </div>
        </div>

        {/* Promociones Activas */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Promociones Activas
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 font-mono">
            {promotions.filter((p) => p.isActive).length} ofertas
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Rebajas vigentes para mostrador
          </div>
        </div>

        {/* Total Facturado */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Total Facturación Histórica
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
            ${sales.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
            {sales.length} facturas emitidas
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Evolución de Ventas & Utilidad Mensual
              </h2>
              <p className="text-xs text-slate-500">Comparativa de ingresos brutos vs ganancia neta</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="ventas" name="Ventas Totales ($)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ganancia" name="Ganancia Neta ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No hay suficientes datos mensuales
              </div>
            )}
          </div>
        </div>

        {/* Category Share Chart (1 col) */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Facturación por Categoría
            </h2>
            <p className="text-xs text-slate-500">Participación en ventas por familia</p>
          </div>

          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(2)}`, 'Venta']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Sin registros</div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Grid: Más Vendidos vs Menos Vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🚀 PRODUCTOS MÁS VENDIDOS */}
        <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 bg-blue-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Productos Más Vendidos (Alta Rotación)
                </h2>
                <p className="text-xs text-slate-500">Repuestos estrella de mayor demanda y salida</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Top Ventas
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {topSoldProducts.length > 0 ? (
              topSoldProducts.map((p, idx) => (
                <div
                  key={p.partId}
                  className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-mono'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700 font-mono'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-900 font-mono'
                          : 'bg-slate-100 text-slate-500 font-mono'
                      }`}
                    >
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{p.partName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.brand} • SKU: {p.sku} • Canasta:{' '}
                        <span className="font-bold text-blue-600">{p.locationBin}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-slate-900 text-sm">
                      {p.unitsSold} vendidas
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono font-bold">
                      ${p.totalRevenue.toFixed(2)} facturado
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aún no hay registros de ventas
              </div>
            )}
          </div>
        </div>

        {/* ⚠️ PRODUCTOS MENOS VENDIDOS / ESTANCADOS */}
        <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Productos Menos Vendidos (Baja Rotación)
                </h2>
                <p className="text-xs text-slate-500">Candidatos para crear promociones y liberar canastas</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Lenta Salida
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {leastSoldProducts.map((p) => {
              const hasActivePromo = promotions.some((pr) => pr.partId === p.partId && pr.isActive);
              return (
                <div
                  key={p.partId}
                  className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 line-clamp-1">{p.partName}</span>
                      {hasActivePromo && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold font-mono shrink-0">
                          EN OFERTA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      En canasta: <span className="font-bold text-blue-600">{p.locationBin}</span> • Stock disponible:{' '}
                      <span className="font-bold text-slate-800">{p.currentStock}</span> • Ventas: {p.unitsSold}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-[11px] text-slate-400">Precio normal</div>
                      <div className="font-bold text-slate-800">${p.salePrice.toFixed(2)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPromoForPart(p.partId)}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{hasActivePromo ? 'Ajustar Oferta' : 'Promocionar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🏆 SECCIÓN: RANKING DE VENDEDORES & ASESOR CON MÁS VENTAS */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Productividad Comercial & Vendedor con Más Ventas
                </h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black font-mono px-2 py-0.5 rounded border border-amber-300">
                  RANKING COMERCIAL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Estadística del desempeño de asesores, colaboradores y administradores en mostrador
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs self-start sm:self-auto">
            Total Facturado: <span className="font-bold text-slate-900">${grandTotalBilled.toFixed(2)}</span>
          </div>
        </div>

        {/* Top Performer Featured Showcase */}
        {topSeller && (
          <div className="p-5 bg-gradient-to-br from-amber-50/60 via-amber-50/20 to-transparent border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-300">
                    {topSeller.sellerName.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-2 p-1 bg-amber-500 text-white rounded-full shadow-xs border-2 border-white">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black tracking-wider uppercase font-mono border border-amber-200">
                    <span>👑</span> VENDEDOR ESTRELLA / TOP #1
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {topSeller.sellerName}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Rol: <span className="font-semibold text-slate-700">{topSeller.sellerRole}</span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics of Top Seller */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Facturado Total</span>
                  <div className="text-base sm:text-lg font-black text-amber-700 font-mono">
                    ${topSeller.totalBilled.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Comprobantes</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {topSeller.invoicesCount} <span className="text-xs font-normal text-slate-400">ventas</span>
                  </div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Piezas Despachadas</span>
                  <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                    {topSeller.unitsSold} <span className="text-xs font-normal text-slate-400">unid.</span>
                  </div>
                </div>

                <div className="bg-white border border-amber-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Aporte a Ventas</span>
                  <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                    {grandTotalBilled > 0 ? ((topSeller.totalBilled / grandTotalBilled) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Team Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <th className="py-3 px-4 w-16 text-center">Posición</th>
                <th className="py-3 px-4">Asesor / Usuario</th>
                <th className="py-3 px-3">Perfil / Rol</th>
                <th className="py-3 px-3 text-center">Facturas Realizadas</th>
                <th className="py-3 px-3 text-center">Piezas Vendidas</th>
                <th className="py-3 px-3 text-right">Total Facturado</th>
                <th className="py-3 px-4 w-40">Participación</th>
                {canViewFinancials && (
                  <th className="py-3 px-4 text-right font-mono">Margen Generado</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sellerLeaderboard.map((seller, idx) => {
                const percentage = grandTotalBilled > 0 ? (seller.totalBilled / grandTotalBilled) * 100 : 0;
                const isWinner = idx === 0 && seller.totalBilled > 0;

                return (
                  <tr key={seller.sellerId} className={`hover:bg-slate-50 transition-colors ${isWinner ? 'bg-amber-50/20' : ''}`}>
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">
                      <div
                        className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-mono'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800 font-mono'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-800 font-mono'
                            : 'bg-slate-100 text-slate-500 font-mono'
                        }`}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                    </td>

                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          {seller.sellerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{seller.sellerName}</span>
                            {isWinner && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.2 rounded font-bold">
                                Líder
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {seller.sellerId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        {seller.sellerRole}
                      </span>
                    </td>

                    {/* Invoices Count */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      <div>{seller.invoicesCount}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {seller.electronicInvoices} elec. • {seller.manualInvoices} man.
                      </div>
                    </td>

                    {/* Units Sold */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {seller.unitsSold} <span className="text-[10px] font-normal text-slate-400">repuestos</span>
                    </td>

                    {/* Total Billed */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ${seller.totalBilled.toFixed(2)}
                    </td>

                    {/* Visual Progress Bar */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>{percentage.toFixed(1)}%</span>
                          <span>de las ventas</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-blue-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Gross Profit (Guarded) */}
                    {canViewFinancials && (
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        +${seller.totalProfit.toFixed(2)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promociones Activas y Vigentes Management Table */}
      <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Listado de Promociones & Descuentos Especiales ({promotions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Los precios promocionales se aplican automáticamente en la facturación y escaneo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (parts.length > 0) {
                setSelectedPartIdForPromo(parts[0].id);
                setIsPromoModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Oferta</span>
          </button>
        </div>

        {promotions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Repuesto en Oferta</th>
                  <th className="py-3 px-3">Motivo / Campaña</th>
                  <th className="py-3 px-3 text-right">Precio Normal</th>
                  <th className="py-3 px-3 text-center">Descuento</th>
                  <th className="py-3 px-3 text-right">Precio Promo</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{promo.partName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        SKU: {promo.sku} • {promo.category}
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="text-slate-700 text-xs font-medium truncate">{promo.reason}</div>
                      <div className="text-[10px] text-slate-400">
                        Hasta: {new Date(promo.endDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500 line-through">
                      ${promo.originalPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="bg-rose-100 text-rose-800 font-mono font-black text-xs px-2 py-0.5 rounded border border-rose-200">
                        -{promo.discountPercent}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      ${promo.promotionalPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onTogglePromotion(promo.id, !promo.isActive)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-colors ${
                          promo.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {promo.isActive ? 'ACTIVA' : 'PAUSADA'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemovePromotion(promo.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Eliminar Promoción"
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
          <div className="p-8 text-center text-slate-400 text-xs space-y-1">
            <Tag className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No hay promociones configuradas</p>
            <p className="text-[11px] text-slate-400">
              Selecciona cualquier repuesto estancado arriba para lanzar una oferta atractiva.
            </p>
          </div>
        )}
      </div>

      {/* MODAL: Crear / Editar Promoción */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Lanzar Promoción / Descuento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajusta el precio especial para liquidación o rotación
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromotionSubmit} className="p-5 space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Repuesto a Promocionar
                </label>
                <select
                  value={selectedPartIdForPromo}
                  onChange={(e) => setSelectedPartIdForPromo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.sku}] — Canasta: {p.location.binCode} (${p.salePrice.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Porcentaje de Descuento
                </label>
                <div className="flex gap-2 mb-2">
                  {[10, 15, 20, 25, 30, 40].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        discountPercent === d
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(90, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">%</span>
                </div>
              </div>

              {/* Calculation Preview */}
              {selectedPartObj && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Precio original:</span>
                    <span>${selectedPartObj.salePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Descuento aplicado ({discountPercent}%):</span>
                    <span>-${(selectedPartObj.salePrice * (discountPercent / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-300">
                    <span>Nuevo Precio de Venta:</span>
                    <span className="text-emerald-700 font-black">
                      ${(selectedPartObj.salePrice * (1 - discountPercent / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Motivo o Campaña Promocional
                </label>
                <input
                  type="text"
                  placeholder="ej: Liquidación de inventario en canasta / Temporada frenos"
                  value={promoReason}
                  onChange={(e) => setPromoReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Duration Days */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Vigencia de la Oferta
                </label>
                <select
                  value={promoDays}
                  onChange={(e) => setPromoDays(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value={7}>7 días (1 semana)</option>
                  <option value={15}>15 días (Quincenal)</option>
                  <option value={30}>30 días (1 mes)</option>
                  <option value={60}>60 días (Bimestral)</option>
                  <option value={90}>90 días (Liquidación total)</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Promoción</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
