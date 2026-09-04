import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { InventoryView } from './components/InventoryView';
import { ShelvingView } from './components/ShelvingView';
import { SalesView } from './components/SalesView';
import { AnalyticsPromotionsView } from './components/AnalyticsPromotionsView';
import { ScannerModal } from './components/ScannerModal';
import { PartFormModal } from './components/PartFormModal';
import { PartDetailModal } from './components/PartDetailModal';
import { BarcodePrintModal, PrintLabelItem } from './components/BarcodePrintModal';
import { MovementsLogModal } from './components/MovementsLogModal';
import { DataBackupModal } from './components/DataBackupModal';
import { NewSaleModal } from './components/NewSaleModal';
import { InvoiceViewerModal } from './components/InvoiceViewerModal';
import { UsersRolesModal } from './components/UsersRolesModal';
import { UserSwitchModal } from './components/UserSwitchModal';
import { ManualDispatchModal } from './components/ManualDispatchModal';
import {
  INITIAL_PARTS,
  INITIAL_RACKS,
  INITIAL_MOVEMENTS,
  INITIAL_SALES,
  INITIAL_PROMOTIONS,
  DEFAULT_ROLES,
  INITIAL_USERS
} from './data/initialData';
import {
  AutoPart,
  RackConfig,
  StockMovement,
  MovementSource,
  SaleInvoice,
  Promotion,
  AppUser,
  UserRole
} from './types';
import { useBarcodeGun } from './hooks/useBarcodeGun';
import { soundManager } from './utils/audio';
import { formatBinCode, findMatchingPart } from './utils/barcode';
import {
  Layers,
  AlertTriangle,
  Package,
  DollarSign,
  ScanLine,
  TrendingDown,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowRight,
  Receipt,
  Tag,
  Users,
  Shield,
  UserCheck
} from 'lucide-react';

const STORAGE_KEY_PARTS = 'autostock_parts_v1';
const STORAGE_KEY_RACKS = 'autostock_racks_v1';
const STORAGE_KEY_MOVEMENTS = 'autostock_movements_v1';
const STORAGE_KEY_SALES = 'autostock_sales_v1';
const STORAGE_KEY_PROMOTIONS = 'autostock_promotions_v1';
const STORAGE_KEY_ROLES = 'autostock_roles_v1';
const STORAGE_KEY_USERS = 'autostock_users_v1';
const STORAGE_KEY_CURRENT_USER = 'autostock_current_user_v1';

export default function App() {
  // State Initialization with local storage persistence
  const [parts, setParts] = useState<AutoPart[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PARTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ({
            ...p,
            compatibleVehicles: Array.isArray(p?.compatibleVehicles) ? p.compatibleVehicles : [],
          }));
        }
        return INITIAL_PARTS;
      } catch {
        return INITIAL_PARTS;
      }
    }
    return INITIAL_PARTS;
  });

  const [racks, setRacks] = useState<RackConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RACKS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Adapt old configurations to the physical 4 columns x 12 rows standard
          return parsed.map((r: RackConfig) => ({
            ...r,
            totalRows: r.totalRows <= 4 ? 12 : r.totalRows,
            totalCols: r.totalCols === 5 ? 4 : r.totalCols,
          }));
        }
        return Array.isArray(parsed) ? parsed : INITIAL_RACKS;
      } catch {
        return INITIAL_RACKS;
      }
    }
    return INITIAL_RACKS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_MOVEMENTS;
      } catch {
        return INITIAL_MOVEMENTS;
      }
    }
    return INITIAL_MOVEMENTS;
  });

  const [sales, setSales] = useState<SaleInvoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SALES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => ({
            ...s,
            items: Array.isArray(s?.items) ? s.items : [],
          }));
        }
        return INITIAL_SALES;
      } catch {
        return INITIAL_SALES;
      }
    }
    return INITIAL_SALES;
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROMOTIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_PROMOTIONS;
      } catch {
        return INITIAL_PROMOTIONS;
      }
    }
    return INITIAL_PROMOTIONS;
  });

  const [roles, setRoles] = useState<UserRole[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ROLES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : DEFAULT_ROLES;
      } catch {
        return DEFAULT_ROLES;
      }
    }
    return DEFAULT_ROLES;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_USERS;
      } catch {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure user exists in users list
        const found = INITIAL_USERS.find((u) => u.id === parsed.id) || parsed;
        return found;
      } catch {
        return INITIAL_USERS[0];
      }
    }
    return INITIAL_USERS[0];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PARTS, JSON.stringify(parts));
  }, [parts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RACKS, JSON.stringify(racks));
  }, [racks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROMOTIONS, JSON.stringify(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  // Navigation and Modal States
  const [activeTab, setActiveTab] = useState<ActiveTab>('INVENTORY');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isPartFormOpen, setIsPartFormOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState<boolean>(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState<boolean>(false);
  const [viewingInvoice, setViewingInvoice] = useState<SaleInvoice | null>(null);
  const [isUsersRolesModalOpen, setIsUsersRolesModalOpen] = useState<boolean>(false);
  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState<boolean>(false);
  const [isManualDispatchModalOpen, setIsManualDispatchModalOpen] = useState<boolean>(false);

  const [editingPart, setEditingPart] = useState<AutoPart | null>(null);
  const [inspectingPart, setInspectingPart] = useState<AutoPart | null>(null);
  const [formInitialBarcode, setFormInitialBarcode] = useState<string | undefined>(undefined);
  const [formInitialLocation, setFormInitialLocation] = useState<{ rack: number; row: number; column: number } | undefined>(undefined);

  // Print Labels State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printItems, setPrintItems] = useState<PrintLabelItem[]>([]);

  // Toast / Flash Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Dispatch Part Handler (Resta stock)
  const handleDispatchPart = useCallback((partId: string, qty: number, source: MovementSource = 'MANUAL'): boolean => {
    let success = false;
    setParts((prevParts) => {
      const target = prevParts.find((p) => p.id === partId);
      if (!target || target.quantity < qty) {
        return prevParts;
      }

      success = true;
      const previousStock = target.quantity;
      const newStock = target.quantity - qty;

      // Register Movement Log
      const newMovement: StockMovement = {
        id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        partId: target.id,
        partName: target.name,
        barcode: target.barcode,
        sku: target.sku,
        type: 'OUT',
        quantityChange: -qty,
        previousStock,
        newStock,
        locationBin: target.location.binCode,
        reason:
          source === 'SCANNER_GUN'
            ? 'Despacho Pistola Lector Barcode'
            : source === 'CAMERA_SCAN'
            ? 'Despacho Escáner Cámara'
            : source === 'SALE_INVOICE'
            ? 'Despacho por Venta & Facturación'
            : 'Despacho Manual Mostrador',
        source,
        timestamp: new Date().toISOString(),
      };

      setMovements((prevMovs) => [newMovement, ...prevMovs]);

      return prevParts.map((p) =>
        p.id === partId
          ? {
              ...p,
              quantity: newStock,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
    });

    return success;
  }, []);

  // Receive Part Handler (Suma stock)
  const handleReceivePart = useCallback((partId: string, qty: number, source: MovementSource = 'MANUAL'): boolean => {
    let success = false;
    setParts((prevParts) => {
      const target = prevParts.find((p) => p.id === partId);
      if (!target) return prevParts;

      success = true;
      const previousStock = target.quantity;
      const newStock = target.quantity + qty;

      const newMovement: StockMovement = {
        id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        partId: target.id,
        partName: target.name,
        barcode: target.barcode,
        sku: target.sku,
        type: 'IN',
        quantityChange: qty,
        previousStock,
        newStock,
        locationBin: target.location.binCode,
        reason:
          source === 'SCANNER_GUN'
            ? 'Ingreso Lote Pistola Barcode'
            : source === 'CAMERA_SCAN'
            ? 'Ingreso Escáner Cámara'
            : 'Ingreso Manual Almacén',
        source,
        timestamp: new Date().toISOString(),
      };

      setMovements((prevMovs) => [newMovement, ...prevMovs]);

      return prevParts.map((p) =>
        p.id === partId
          ? {
              ...p,
              quantity: newStock,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
    });

    return success;
  }, []);

  // Quick stock change from buttons (+1 or -1)
  const handleQuickStockChange = useCallback((partId: string, delta: number) => {
    if (delta < 0) {
      const done = handleDispatchPart(partId, Math.abs(delta), 'MANUAL');
      if (done) soundManager.playSuccessBeep();
    } else {
      const done = handleReceivePart(partId, delta, 'MANUAL');
      if (done) soundManager.playSuccessBeep();
    }
  }, [handleDispatchPart, handleReceivePart]);

  // Complete New Sale & Deduct Inventory in Bulk
  const handleCompleteSale = useCallback((sale: SaleInvoice) => {
    // 1. Add sale to state
    setSales((prev) => [sale, ...prev]);

    // 2. Deduct inventory & generate audit logs for each part sold
    setParts((prevParts) => {
      let updatedParts = [...prevParts];
      const newMovements: StockMovement[] = [];

      sale.items.forEach((item) => {
        const target = updatedParts.find((p) => p.id === item.partId);
        if (target) {
          const previousStock = target.quantity;
          const newStock = Math.max(0, target.quantity - item.quantity);

          updatedParts = updatedParts.map((p) =>
            p.id === item.partId
              ? { ...p, quantity: newStock, updatedAt: new Date().toISOString() }
              : p
          );

          newMovements.push({
            id: 'mov-sale-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            partId: target.id,
            partName: target.name,
            barcode: target.barcode,
            sku: target.sku,
            type: 'OUT',
            quantityChange: -item.quantity,
            previousStock,
            newStock,
            locationBin: target.location.binCode,
            reason: `Venta Factura ${sale.invoiceNumber} (${sale.type === 'ELECTRONIC' ? 'Electrónica' : 'Manual'}) - Cliente: ${sale.customerName}`,
            source: 'SALE_INVOICE',
            timestamp: sale.createdAt,
            user: 'Caja & Facturación',
          });
        }
      });

      if (newMovements.length > 0) {
        setMovements((prevMovs) => [...newMovements, ...prevMovs]);
      }

      return updatedParts;
    });

    soundManager.playSuccessBeep();
    showToast(
      `Factura ${sale.invoiceNumber} emitida exitosamente por $${sale.total.toFixed(2)}. Stock descontado.`,
      'success'
    );

    // Open viewing modal immediately
    setViewingInvoice(sale);
  }, [showToast]);

  // Cancel / Delete Sale
  const handleCancelSale = useCallback((saleId: string) => {
    const target = sales.find((s) => s.id === saleId);
    if (!target) return;

    if (
      window.confirm(
        `¿Estás seguro de anular la factura ${target.invoiceNumber} por $${target.total.toFixed(2)}? Se reingresará el stock al inventario.`
      )
    ) {
      // Re-add stock
      setParts((prevParts) => {
        let updatedParts = [...prevParts];
        const newMovements: StockMovement[] = [];

        target.items.forEach((item) => {
          const part = updatedParts.find((p) => p.id === item.partId);
          if (part) {
            const previousStock = part.quantity;
            const newStock = part.quantity + item.quantity;

            updatedParts = updatedParts.map((p) =>
              p.id === item.partId
                ? { ...p, quantity: newStock, updatedAt: new Date().toISOString() }
                : p
            );

            newMovements.push({
              id: 'mov-cancel-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              partId: part.id,
              partName: part.name,
              barcode: part.barcode,
              sku: part.sku,
              type: 'IN',
              quantityChange: item.quantity,
              previousStock,
              newStock,
              locationBin: part.location.binCode,
              reason: `Reingreso por Anulación Factura ${target.invoiceNumber}`,
              source: 'MANUAL',
              timestamp: new Date().toISOString(),
            });
          }
        });

        if (newMovements.length > 0) {
          setMovements((prev) => [...newMovements, ...prev]);
        }

        return updatedParts;
      });

      setSales((prev) => prev.filter((s) => s.id !== saleId));
      showToast(`Factura ${target.invoiceNumber} anulada y piezas reingresadas.`, 'info');
    }
  }, [sales, showToast]);

  // Promotions Management Handlers
  const handleAddPromotion = useCallback((promo: Promotion) => {
    setPromotions((prev) => [promo, ...prev]);
    // Apply promo price to part
    setParts((prev) =>
      prev.map((p) =>
        p.id === promo.partId
          ? { ...p, promotionalPrice: promo.promotionalPrice }
          : p
      )
    );
    showToast(`Promoción para "${promo.partName}" activada (-${promo.discountPercent}%).`, 'success');
  }, [showToast]);

  const handleRemovePromotion = useCallback((promoId: string) => {
    const promo = promotions.find((p) => p.id === promoId);
    if (!promo) return;

    setPromotions((prev) => prev.filter((p) => p.id !== promoId));
    // Reset part promotional price if no other active promo exists
    setParts((prev) =>
      prev.map((p) =>
        p.id === promo.partId
          ? { ...p, promotionalPrice: undefined }
          : p
      )
    );
    showToast(`Promoción eliminada.`, 'info');
  }, [promotions, showToast]);

  const handleTogglePromotion = useCallback((promoId: string, isActive: boolean) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id === promoId) {
          const updated = { ...p, isActive };
          // Update part promotionalPrice
          setParts((prevParts) =>
            prevParts.map((part) =>
              part.id === p.partId
                ? { ...part, promotionalPrice: isActive ? p.promotionalPrice : undefined }
                : part
            )
          );
          return updated;
        }
        return p;
      })
    );
  }, []);

  // Global Hardware Barcode Gun Listener
  const handleGlobalBarcodeScan = useCallback((barcode: string) => {
    const matched = findMatchingPart(parts, barcode);

    if (matched) {
      soundManager.playSuccessBeep();
      setInspectingPart(matched);
      showToast(
        `🔫 Pistola leyó: ${matched.name} | Ubicación: ${matched.location.binCode} | Stock: ${matched.quantity}`,
        'success'
      );
    } else {
      soundManager.playWarningBeep();
      setFormInitialBarcode(barcode);
      setEditingPart(null);
      setIsPartFormOpen(true);
      showToast(
        `Código nuevo "${barcode}". Abriendo formulario de registro.`,
        'info'
      );
    }
  }, [parts, showToast]);

  const { isGunActive } = useBarcodeGun({
    onScan: handleGlobalBarcodeScan,
    enabled: !isScannerModalOpen && !isNewSaleModalOpen,
  });

  // Save part (Create or Edit)
  const handleSavePart = (partData: Omit<AutoPart, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => {
    const now = new Date().toISOString();
    if (editId) {
      setParts((prev) =>
        prev.map((p) => (p.id === editId ? { ...partData, id: editId, createdAt: p.createdAt, updatedAt: now } : p))
      );
      showToast(`Repuesto "${partData.name}" actualizado con éxito.`, 'success');
    } else {
      const newPart: AutoPart = {
        ...partData,
        id: 'part-' + Date.now(),
        createdAt: now,
        updatedAt: now,
      };
      setParts((prev) => [newPart, ...prev]);

      // Log initial creation stock
      if (newPart.quantity > 0) {
        const initialMov: StockMovement = {
          id: 'mov-' + Date.now(),
          partId: newPart.id,
          partName: newPart.name,
          barcode: newPart.barcode,
          sku: newPart.sku,
          type: 'IN',
          quantityChange: newPart.quantity,
          previousStock: 0,
          newStock: newPart.quantity,
          locationBin: newPart.location.binCode,
          reason: 'Registro Inicial de Repuesto en Almacén',
          source: 'MANUAL',
          timestamp: now,
        };
        setMovements((prev) => [initialMov, ...prev]);
      }

      showToast(`Nuevo repuesto "${newPart.name}" asignado a ${newPart.location.binCode}.`, 'success');
    }
  };

  // Delete part
  const handleDeletePart = (partId: string) => {
    const target = parts.find((p) => p.id === partId);
    if (!target) return;
    if (window.confirm(`¿Estás seguro de eliminar "${target.name}"?`)) {
      setParts((prev) => prev.filter((p) => p.id !== partId));
      if (inspectingPart?.id === partId) {
        setInspectingPart(null);
      }
      showToast(`Repuesto eliminado del inventario.`, 'info');
    }
  };

  // Print Single Part Barcode Sticker
  const handlePrintPartBarcode = (part: AutoPart) => {
    setPrintItems([
      {
        id: part.id,
        title: part.name,
        subtitle: `${part.brand} • ${part.compatibleVehicles.slice(0, 2).join(', ')}`,
        barcodeValue: part.barcode,
        locationCode: part.location.binCode,
        price: part.promotionalPrice || part.salePrice,
        sku: part.sku,
        type: 'PART',
      },
    ]);
    setIsPrintModalOpen(true);
  };

  // Print Bin Location Barcode Tag (Stick to plastic basket)
  const handlePrintBinLabel = (binCode: string, rackNum: number, rowNum: number, colNum: number, partNames: string[]) => {
    setPrintItems([
      {
        id: `bin-${binCode}`,
        title: `CANASTA ${binCode}`,
        subtitle: partNames.length > 0 ? partNames.slice(0, 2).join(', ') : 'Canasta de Almacenamiento',
        barcodeValue: binCode,
        locationCode: `EST ${rackNum} • F${rowNum} • C${colNum}`,
        type: 'BIN_LOCATION',
      },
    ]);
    setIsPrintModalOpen(true);
  };

  // Print All Bins of a Rack
  const handlePrintAllRackBins = (rack: RackConfig) => {
    const itemsToPrint: PrintLabelItem[] = [];
    for (let r = 1; r <= rack.totalRows; r++) {
      for (let c = 1; c <= rack.totalCols; c++) {
        const code = formatBinCode(rack.rackNumber, r, c);
        const partsInBin = parts.filter((p) => p.location.binCode === code);
        itemsToPrint.push({
          id: `bin-${code}`,
          title: `CANASTA ${code}`,
          subtitle: partsInBin.length > 0 ? partsInBin.map((p) => p.name).slice(0, 2).join(', ') : 'Canasta Libre',
          barcodeValue: code,
          locationCode: `EST #${rack.rackNumber} • Fila ${r} • Col ${c}`,
          type: 'BIN_LOCATION',
        });
      }
    }
    setPrintItems(itemsToPrint);
    setIsPrintModalOpen(true);
  };

  // Rack configs handlers
  const handleUpdateRackConfig = (updated: RackConfig) => {
    setRacks((prev) => prev.map((r) => (r.rackNumber === updated.rackNumber ? updated : r)));
    showToast(`Configuración de ${updated.name} actualizada.`, 'success');
  };

  const handleAddNewRack = (newRack: RackConfig) => {
    setRacks((prev) => [...prev, newRack]);
    showToast(`Nueva ${newRack.name} agregada al almacén.`, 'success');
  };

  // RBAC & User Management Handlers
  const handleSwitchUser = (user: AppUser) => {
    const role = roles.find((r) => r.id === user.roleId);
    const hydratedUser: AppUser = {
      ...user,
      roleName: user.roleName || role?.name || 'Usuario',
      permissions: user.permissions || role?.permissions,
    };
    setCurrentUser(hydratedUser);
    soundManager.playSuccessBeep();
    showToast(`Sesión iniciada como "${hydratedUser.name}" (${hydratedUser.roleName}).`, 'success');
  };

  const handleAddUser = (newUser: AppUser) => {
    setUsers((prev) => [...prev, newUser]);
    showToast(`Usuario "${newUser.name}" creado con éxito.`, 'success');
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`Datos del usuario "${updatedUser.name}" actualizados.`, 'success');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      showToast('No puedes eliminar el usuario con el que tienes la sesión activa.', 'warning');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('Usuario eliminado del sistema.', 'info');
  };

  const handleAddRole = (newRole: UserRole) => {
    setRoles((prev) => [...prev, newRole]);
    showToast(`Nuevo rol "${newRole.name}" creado con sus permisos.`, 'success');
  };

  const handleUpdateRole = (updatedRole: UserRole) => {
    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
    // Also update users that belong to this role
    setUsers((prev) =>
      prev.map((u) => {
        if (u.roleId === updatedRole.id) {
          return {
            ...u,
            roleName: updatedRole.name,
            permissions: updatedRole.permissions,
          };
        }
        return u;
      })
    );
    if (currentUser.roleId === updatedRole.id) {
      setCurrentUser((prev) => ({
        ...prev,
        roleName: updatedRole.name,
        permissions: updatedRole.permissions,
      }));
    }
    showToast(`Rol "${updatedRole.name}" y permisos de usuarios actualizados.`, 'success');
  };

  const handleDeleteRole = (roleId: string) => {
    const usersInRole = users.filter((u) => u.roleId === roleId);
    if (usersInRole.length > 0) {
      showToast(`No puedes eliminar este rol porque tiene ${usersInRole.length} usuarios asignados.`, 'warning');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    showToast('Rol eliminado del sistema.', 'info');
  };

  // Manual Dispatch / Receive (when barcode gun fails)
  const handleManualDispatch = (partId: string, qty: number, source: 'MANUAL', customReason?: string): boolean => {
    return handleDispatchPart(partId, qty, source, customReason || 'Despacho manual de emergencia');
  };

  const handleManualReceive = (partId: string, qty: number, source: 'MANUAL', customReason?: string): boolean => {
    return handleReceivePart(partId, qty, source, customReason || 'Ingreso manual al almacén');
  };

  // Global totals for metrics banner
  const totalStockUnits = parts.reduce((sum, p) => sum + p.quantity, 0);
  const totalStockValue = parts.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
  const lowStockCount = parts.filter((p) => p.quantity <= p.minStock).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parts={parts}
        racks={racks}
        sales={sales}
        currentUser={currentUser}
        roles={roles}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenNewPartModal={() => {
          setEditingPart(null);
          setFormInitialBarcode(undefined);
          setFormInitialLocation(undefined);
          setIsPartFormOpen(true);
        }}
        onOpenNewSaleModal={() => setIsNewSaleModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenMovementsModal={() => setIsMovementsModalOpen(true)}
        onOpenUserSwitchModal={() => setIsUserSwitchModalOpen(true)}
        onOpenUsersRolesModal={() => setIsUsersRolesModalOpen(true)}
        onOpenManualDispatchModal={() => setIsManualDispatchModalOpen(true)}
        isGunActive={isGunActive}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-lg shadow-xl border-2 text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-white border-emerald-500 text-emerald-800'
                : toastMessage.type === 'warning'
                ? 'bg-white border-rose-500 text-rose-800'
                : 'bg-white border-blue-600 text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick Warehouse Health Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-400 transition-colors">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Total Repuestos
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
                {parts.length} <span className="text-xs font-normal text-slate-500 font-sans">referencias</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-400 transition-colors">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Unidades en Stock
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 font-mono">
                {totalStockUnits} <span className="text-xs font-normal text-slate-500 font-sans">piezas</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-rose-400 transition-colors">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Alertas Stock Bajo
              </span>
              <div
                className={`text-xl sm:text-2xl font-black mt-0.5 font-mono ${
                  lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'
                }`}
              >
                {lowStockCount} <span className="text-xs font-normal text-slate-500 font-sans">críticos</span>
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                lowStockCount > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-400 transition-colors">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 block tracking-wider">
                Valor Total Almacén
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5 font-mono">
                {currentUser.permissions?.viewFinancials ? (
                  `$${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                ) : (
                  <span className="text-sm font-sans text-slate-400">Protegido (Admin)</span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Switcher based on Active Tab */}
        {activeTab === 'INVENTORY' && (
          <InventoryView
            parts={parts}
            racks={racks}
            currentUser={currentUser}
            onOpenCreate={() => {
              setEditingPart(null);
              setFormInitialBarcode(undefined);
              setFormInitialLocation(undefined);
              setIsPartFormOpen(true);
            }}
            onEditPart={(part) => {
              setEditingPart(part);
              setIsPartFormOpen(true);
            }}
            onDeletePart={handleDeletePart}
            onInspectPart={(part) => setInspectingPart(part)}
            onPrintPartBarcode={handlePrintPartBarcode}
            onQuickStockChange={handleQuickStockChange}
          />
        )}

        {activeTab === 'SHELVING' && (
          <ShelvingView
            racks={racks}
            parts={parts}
            onSelectPart={(part) => setInspectingPart(part)}
            onAddPartToBin={(rackNum, rowNum, colNum) => {
              setEditingPart(null);
              setFormInitialBarcode(undefined);
              setFormInitialLocation({ rack: rackNum, row: rowNum, column: colNum });
              setIsPartFormOpen(true);
            }}
            onPrintBinLabel={handlePrintBinLabel}
            onPrintAllRackBins={handlePrintAllRackBins}
            onUpdateRackConfig={handleUpdateRackConfig}
            onAddNewRack={handleAddNewRack}
          />
        )}

        {activeTab === 'SALES' && (
          <SalesView
            sales={sales}
            currentUser={currentUser}
            users={users}
            onOpenNewSale={() => setIsNewSaleModalOpen(true)}
            onViewInvoice={(sale) => setViewingInvoice(sale)}
            onCancelSale={handleCancelSale}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsPromotionsView
            parts={parts}
            sales={sales}
            promotions={promotions}
            currentUser={currentUser}
            users={users}
            onAddPromotion={handleAddPromotion}
            onRemovePromotion={handleRemovePromotion}
            onTogglePromotion={handleTogglePromotion}
          />
        )}

        {activeTab === 'MOVEMENTS' && (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Registro de Movimientos & Kardex
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Histórico completo de despachos con pistola de código de barras, ventas facturadas, ingresos y ajustes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMovementsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm self-start sm:self-auto transition-colors"
              >
                Abrir Auditoría Completa
              </button>
            </div>

            {/* Quick table preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-sans font-semibold">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3 font-sans">Repuesto</th>
                    <th className="py-3 px-3">Canasta</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-3 font-sans">Motivo / Factura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.slice(0, 10).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.type === 'OUT'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {m.type === 'OUT' ? 'SALIDA' : 'ENTRADA'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                        {m.partName}
                      </td>
                      <td className="py-2.5 px-3 text-blue-600 font-bold">
                        {m.locationBin}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {m.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 border border-white"></div>
            </div>
            <span className="font-semibold text-slate-700">AutoStock • Sistema de Almacén, Ventas y Facturación</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Organización Matricial por Estantería, Fila y Canasta
          </span>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Barcode Scanner Terminal Modal */}
      <ScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        parts={parts}
        onDispatchPart={handleDispatchPart}
        onReceivePart={handleReceivePart}
        onOpenCreateWithBarcode={(scannedCode) => {
          setFormInitialBarcode(scannedCode);
          setEditingPart(null);
          setIsPartFormOpen(true);
        }}
        onSelectPartForInspection={(part) => setInspectingPart(part)}
      />

      {/* 2. Part Create / Edit Modal */}
      <PartFormModal
        isOpen={isPartFormOpen}
        onClose={() => {
          setIsPartFormOpen(false);
          setEditingPart(null);
          setFormInitialBarcode(undefined);
          setFormInitialLocation(undefined);
        }}
        onSave={handleSavePart}
        initialPart={editingPart}
        racks={racks}
        initialBarcode={formInitialBarcode}
        initialLocation={formInitialLocation}
      />

      {/* 3. Part Detail Inspector Modal */}
      <PartDetailModal
        part={inspectingPart}
        isOpen={!!inspectingPart}
        onClose={() => setInspectingPart(null)}
        onEdit={(part) => {
          setEditingPart(part);
          setIsPartFormOpen(true);
        }}
        onDelete={handleDeletePart}
        onPrint={handlePrintPartBarcode}
        movements={movements}
        onQuickStockChange={handleQuickStockChange}
      />

      {/* 4. Barcode Print / Labels Sheet Modal */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={printItems}
      />

      {/* 5. Movements Log & Kardex Modal */}
      <MovementsLogModal
        isOpen={isMovementsModalOpen}
        onClose={() => setIsMovementsModalOpen(false)}
        movements={movements}
        onClearMovements={() => {
          if (window.confirm('¿Deseas vaciar el historial de movimientos?')) {
            setMovements([]);
          }
        }}
      />

      {/* 6. Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        parts={parts}
        racks={racks}
        movements={movements}
        onImportData={(data) => {
          if (data.parts) setParts(data.parts);
          if (data.racks) setRacks(data.racks);
          if (data.movements) setMovements(data.movements);
        }}
        onResetToDemo={() => {
          setParts(INITIAL_PARTS);
          setRacks(INITIAL_RACKS);
          setMovements(INITIAL_MOVEMENTS);
          setSales(INITIAL_SALES);
          setPromotions(INITIAL_PROMOTIONS);
          setRoles(DEFAULT_ROLES);
          setUsers(INITIAL_USERS);
          setCurrentUser(INITIAL_USERS[0]);
          localStorage.removeItem(STORAGE_KEY_PARTS);
          localStorage.removeItem(STORAGE_KEY_RACKS);
          localStorage.removeItem(STORAGE_KEY_MOVEMENTS);
          localStorage.removeItem(STORAGE_KEY_SALES);
          localStorage.removeItem(STORAGE_KEY_PROMOTIONS);
          localStorage.removeItem(STORAGE_KEY_ROLES);
          localStorage.removeItem(STORAGE_KEY_USERS);
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        }}
      />

      {/* 7. New Sale & Point of Sale Modal */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        parts={parts}
        currentUser={currentUser}
        users={users}
        roles={roles}
        onCompleteSale={handleCompleteSale}
      />

      {/* 8. Official Invoice Viewer & Thermal Receipt Modal */}
      <InvoiceViewerModal
        isOpen={!!viewingInvoice}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
      />

      {/* 9. RBAC Users & Roles Manager Modal */}
      <UsersRolesModal
        isOpen={isUsersRolesModalOpen}
        onClose={() => setIsUsersRolesModalOpen(false)}
        users={users}
        roles={roles}
        currentUser={currentUser}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onAddRole={handleAddRole}
        onUpdateRole={handleUpdateRole}
        onDeleteRole={handleDeleteRole}
      />

      {/* 10. Quick User Profile Switcher Modal */}
      <UserSwitchModal
        isOpen={isUserSwitchModalOpen}
        onClose={() => setIsUserSwitchModalOpen(false)}
        users={users}
        roles={roles}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenManageUsers={() => {
          setIsUserSwitchModalOpen(false);
          setIsUsersRolesModalOpen(true);
        }}
      />

      {/* 11. Manual Dispatch Modal (Fallback when hardware barcode gun fails) */}
      <ManualDispatchModal
        isOpen={isManualDispatchModalOpen}
        onClose={() => setIsManualDispatchModalOpen(false)}
        parts={parts}
        currentUser={currentUser}
        onDispatchPart={handleManualDispatch}
        onReceivePart={handleManualReceive}
      />
    </div>
  );
}
