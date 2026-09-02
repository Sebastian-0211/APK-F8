export interface LocationBin {
  rack: number; // Número de Estantería (1, 2, 3...)
  row: number;  // Fila / Nivel de abajo hacia arriba o arriba hacia abajo (1, 2, 3, 4)
  column: number; // Columna de la canasta (1, 2, 3, 4, 5)
  binCode: string; // Formato estándar: EST-1-F2-C3
  binLabel?: string; // Etiqueta descriptiva opcional
}

export type PartCategory =
  | 'Frenos'
  | 'Motor y Componentes'
  | 'Filtros y Lubricantes'
  | 'Suspensión y Dirección'
  | 'Transmisión y Embrague'
  | 'Sistema Eléctrico e Iluminación'
  | 'Refrigeración y Clima'
  | 'Carrocería y Accesorios'
  | 'Otros';

export interface AutoPart {
  id: string;
  barcode: string; // Código de barras (EAN-13, Code 128 o personalizado)
  sku: string; // Código interno (ej: REP-FRE-001)
  oemCode?: string; // Código de fabricante original (OEM)
  name: string; // Nombre del repuesto (ej: Pastillas de Freno Delanteras)
  brand: string; // Marca del repuesto (Bosch, Brembo, Denso, etc.)
  category: PartCategory;
  compatibleVehicles: string[]; // Modelos compatibles (ej: Toyota Corolla 2014-2022)
  location: LocationBin;
  quantity: number; // Stock actual
  minStock: number; // Umbral de stock mínimo
  costPrice: number; // Precio de compra
  salePrice: number; // Precio de venta normal
  promotionalPrice?: number; // Precio con oferta/descuento si aplica
  unit: string; // 'Unidades', 'Juegos', 'Kits', 'Pares'
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'LOCATION_CHANGE';
export type MovementSource = 'SCANNER_GUN' | 'CAMERA_SCAN' | 'MANUAL' | 'BULK_IMPORT' | 'SALE_INVOICE';

export interface StockMovement {
  id: string;
  partId: string;
  partName: string;
  barcode: string;
  sku: string;
  type: MovementType;
  quantityChange: number; // +5 o -2
  previousStock: number;
  newStock: number;
  locationBin: string;
  reason: string; // ej: 'Despacho Pistola Barcode', 'Ingreso Proveedor', 'Venta Mostrador'
  source: MovementSource;
  timestamp: string;
  user?: string;
  invoiceNumber?: string;
}

export interface RackConfig {
  rackNumber: number;
  name: string; // ej: 'Estantería 1 - Frenos y Suspensión'
  totalRows: number; // ej: 4 filas
  totalCols: number; // ej: 5 canastas por fila
  description?: string;
  colorTheme?: string;
}

export type ScannerOperationMode =
  | 'DISPATCH' // Despacho rápido (Resta stock)
  | 'RECEIVE'  // Ingreso rápido (Suma stock)
  | 'LOOKUP'   // Consulta de ubicación y precio
  | 'REGISTER'; // Registro de nuevo repuesto con el código escaneado

// ==========================================
// TIPOS DE VENTAS, FACTURACIÓN Y PROMOCIONES
// ==========================================

export type InvoiceType = 'MANUAL' | 'ELECTRONIC';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'OTHER';

export interface SaleItem {
  partId: string;
  partName: string;
  sku: string;
  barcode: string;
  brand: string;
  category: PartCategory;
  unit: string;
  quantity: number;
  unitPrice: number; // Precio unitario cobrado
  costPrice: number; // Costo unitario para cálculo de ganancia
  discountPercent: number; // Descuento en %
  subtotal: number; // quantity * unitPrice * (1 - discountPercent/100)
  locationBin: string; // Canasta de donde sale el repuesto
}

export interface ElectronicInvoiceDetails {
  authorizationCode: string; // Clave de Acceso / CUFE / CAE
  digitalStamp: string; // Firma o sello digital
  qrData: string; // Datos para QR de validación tributaria
  emissionDate: string;
  resolutionNumber: string; // Resolución de facturación
  prefix: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string; // ej: FAC-E001-000104 o MAN-001-00052
  type: InvoiceType; // 'MANUAL' o 'ELECTRONIC'
  status: InvoiceStatus;
  customerName: string;
  customerDocument: string; // NIT / RUC / Cédula / DNI
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  subtotal: number;
  taxPercent: number; // ej: 19, 16, 12, 0
  taxAmount: number;
  discountTotal: number;
  total: number;
  totalCost: number; // Para cálculo de utilidad neta
  grossProfit: number; // total - taxAmount - totalCost
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string; // ISO date
  sellerId?: string; // ID del usuario que vendió
  sellerName?: string; // Nombre del asesor / vendedor
  sellerRole?: string; // Rol del usuario al momento de la venta
  electronicDetails?: ElectronicInvoiceDetails;
}

export interface Promotion {
  id: string;
  partId: string;
  partName: string;
  sku: string;
  category: PartCategory;
  originalPrice: number;
  discountPercent: number; // ej: 15%
  promotionalPrice: number; // originalPrice * (1 - discountPercent/100)
  reason: string; // ej: 'Baja rotación (+60 días)', 'Exceso de inventario', 'Oferta de fin de mes'
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ==========================================
// USUARIOS, ROLES Y CONTROL DE ACCESO (RBAC)
// ==========================================

export interface RolePermissions {
  viewFinancials: boolean;       // Ver costos de compra, utilidades, margen de ganancia
  manageInventory: boolean;      // Crear, editar y eliminar repuestos y estanterías
  createSales: boolean;          // Emitir facturas manuales y electrónicas
  manualStockAdjust: boolean;    // Descontar o ajustar stock manualmente sin pistola
  manageUsersAndRoles: boolean;  // Crear, modificar o eliminar usuarios y roles
  viewAnalytics: boolean;        // Ver estadísticas generales y ranking de vendedores
  managePromotions: boolean;     // Crear y activar descuentos / promociones
  cancelSales: boolean;          // Anular facturas y reingresar stock
  backupData: boolean;           // Exportar e importar copias de seguridad
}

export interface UserRole {
  id: string;
  name: string; // 'Dueño', 'Administrador', 'Vendedor', 'Empleado', o personalizado
  description: string;
  color: string; // 'amber', 'blue', 'emerald', 'purple', 'rose', 'indigo', 'cyan'
  isSystemDefault?: boolean; // Roles predeterminados protegidos contra borrado accidental
  permissions: RolePermissions;
  createdAt?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string; // Referencia a UserRole.id
  roleName?: string; // Nombre del rol para despliegue rápido
  permissions?: RolePermissions; // Permisos asignados
  pin: string; // Código PIN de 4 dígitos para cambio rápido en mostrador/taller
  avatarColor: string; // Color para avatar de usuario
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string;
}


