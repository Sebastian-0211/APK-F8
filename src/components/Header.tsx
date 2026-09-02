import React from 'react';
import {
  Wrench,
  Layers,
  Clock,
  ScanLine,
  Database,
  Plus,
  AlertTriangle,
  Zap,
  PackageCheck,
  Tag,
  Receipt,
  TrendingUp,
  Sparkles,
  Users,
  Shield,
  UserCheck,
  ArrowDownRight
} from 'lucide-react';
import { AutoPart, RackConfig, SaleInvoice, AppUser, UserRole } from '../types';

export type ActiveTab = 'INVENTORY' | 'SHELVING' | 'SALES' | 'ANALYTICS' | 'MOVEMENTS';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  parts: AutoPart[];
  racks: RackConfig[];
  sales: SaleInvoice[];
  currentUser: AppUser;
  roles: UserRole[];
  onOpenScannerModal: () => void;
  onOpenNewPartModal: () => void;
  onOpenNewSaleModal: () => void;
  onOpenBackupModal: () => void;
  onOpenMovementsModal: () => void;
  onOpenUserSwitchModal: () => void;
  onOpenUsersRolesModal: () => void;
  onOpenManualDispatchModal: () => void;
  isGunActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  parts,
  racks,
  sales,
  currentUser,
  roles,
  onOpenScannerModal,
  onOpenNewPartModal,
  onOpenNewSaleModal,
  onOpenBackupModal,
  onOpenMovementsModal,
  onOpenUserSwitchModal,
  onOpenUsersRolesModal,
  onOpenManualDispatchModal,
  isGunActive,
}) => {
  const currentRole = roles.find((r) => r.id === currentUser.roleId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-xs shrink-0">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white rounded-xs"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight font-sans">
                  AUTOPART <span className="text-blue-600">GRID</span>
                </span>
                <span className="hidden md:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-mono">
                  Almacén Central
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                Inventario Matricial por Canastas, Facturación y Control RBAC
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop & Tablet) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('INVENTORY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'INVENTORY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Inventario</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                  activeTab === 'INVENTORY' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {parts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SHELVING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'SHELVING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Estanterías</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                  activeTab === 'SHELVING' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {racks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SALES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'SALES'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ventas & Facturas</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                  activeTab === 'SALES' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {sales.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'ANALYTICS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Estadísticas & Ranking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MOVEMENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'MOVEMENTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Kardex</span>
            </button>
          </nav>

          {/* Right Actions: User Switcher, Despacho Manual, Facturar, Escanear */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Active User Pill with Quick Switch */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onOpenUserSwitchModal}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all text-left group"
                title="Cambiar de Operador / Usuario activo"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs group-hover:bg-blue-600 transition-colors">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-blue-600" />
                    {currentRole?.name || 'Usuario'}
                  </div>
                </div>
              </button>
            </div>

            {/* Users & Roles Settings Button */}
            <button
              type="button"
              onClick={onOpenUsersRolesModal}
              className="p-2 sm:p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors shadow-xs"
              title="Gestión de Usuarios, Roles y Permisos (RBAC)"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Manual Dispatch (Fallback when barcode gun fails) */}
            <button
              type="button"
              onClick={onOpenManualDispatchModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs"
              title="Despachar o Ajustar Material Manualmente (Sin Pistola)"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Despacho Manual</span>
            </button>

            {/* Global Hardware Gun Listening Status */}
            <div
              className={`hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                isGunActive
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-400/40 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="El sistema escucha automáticamente los disparos de cualquier lector de código de barras USB o Bluetooth"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isGunActive ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
              />
              <span className="font-semibold">{isGunActive ? '¡Disparo!' : 'Pistola Lista'}</span>
            </div>

            {/* Quick Facturar / Nueva Venta Button */}
            <button
              type="button"
              onClick={onOpenNewSaleModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs"
              title="Emitir Factura Manual o Electrónica"
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Facturar</span>
            </button>

            {/* Scanner Terminal Primary Trigger Button */}
            <button
              type="button"
              onClick={onOpenScannerModal}
              className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden xs:inline">Escanear</span>
            </button>

            {/* Backup & Settings */}
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors shadow-xs"
              title="Copias de Seguridad, Exportar e Importar"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Medium and Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-between py-2 border-t border-slate-200 gap-1 text-[11px] font-bold bg-slate-50 -mx-3 sm:-mx-6 px-3 sm:px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('INVENTORY')}
            className={`px-2.5 py-1.5 text-center rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'INVENTORY' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            📦 Repuestos ({parts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SHELVING')}
            className={`px-2.5 py-1.5 text-center rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'SHELVING' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🗄️ Estanterías
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SALES')}
            className={`px-2.5 py-1.5 text-center rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'SALES' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            🧾 Ventas ({sales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-2.5 py-1.5 text-center rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'ANALYTICS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            📊 Estadísticas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-2.5 py-1.5 text-center rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'MOVEMENTS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-white'
            }`}
          >
            ⏱️ Kardex
          </button>
        </div>
      </div>
    </header>
  );
};

