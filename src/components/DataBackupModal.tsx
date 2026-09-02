import React, { useRef, useState } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { AutoPart, RackConfig, StockMovement, SaleInvoice, Promotion } from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
  racks: RackConfig[];
  movements: StockMovement[];
  sales?: SaleInvoice[];
  promotions?: Promotion[];
  onImportData: (data: {
    parts?: AutoPart[];
    racks?: RackConfig[];
    movements?: StockMovement[];
    sales?: SaleInvoice[];
    promotions?: Promotion[];
  }) => void;
  onResetToDemo: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  parts,
  racks,
  movements,
  sales = [],
  promotions = [],
  onImportData,
  onResetToDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const fullBackup = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      parts,
      racks,
      movements,
      sales,
      promotions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `autostock_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportPartsCSV = () => {
    if (parts.length === 0) return;

    const headers = [
      'ID',
      'Codigo de Barras',
      'SKU',
      'Codigo OEM',
      'Nombre Repuesto',
      'Marca',
      'Categoria',
      'Estanteria',
      'Fila',
      'Columna',
      'Codigo Canasta',
      'Stock Actual',
      'Stock Minimo',
      'Precio Costo',
      'Precio Venta',
      'Precio Promocional',
      'Unidad',
      'Modelos Compatibles',
      'Notas',
    ];

    const rows = parts.map((p) => [
      p.id,
      p.barcode,
      p.sku,
      p.oemCode || '',
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.brand.replace(/"/g, '""')}"`,
      p.category,
      p.location.rack,
      p.location.row,
      p.location.column,
      p.location.binCode,
      p.quantity,
      p.minStock,
      p.costPrice,
      p.salePrice,
      p.promotionalPrice || '',
      p.unit,
      `"${p.compatibleVehicles.join('; ').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_repuestos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.parts && Array.isArray(json.parts)) {
          onImportData(json);
          setImportMessage({
            success: true,
            text: `¡Restauración exitosa! Se importaron ${json.parts.length} repuestos, ${json.racks?.length || 0} estanterías y ${json.sales?.length || 0} facturas de venta.`,
          });
        } else {
          setImportMessage({
            success: false,
            text: 'El archivo no tiene el formato de copia de seguridad válido.',
          });
        }
      } catch {
        setImportMessage({
          success: false,
          text: 'Error al leer el archivo JSON.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Copia de Seguridad y Datos
              </h2>
              <p className="text-xs text-slate-500">
                Exporta o importa el inventario, facturas y promociones para respaldarlo
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {importMessage && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                importMessage.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {importMessage.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importMessage.text}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
              1. Exportar y Respaldar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-2.5 p-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-left shadow-xs"
              >
                <FileJson className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <div className="text-slate-900 font-bold">Copia Completa (.JSON)</div>
                  <div className="text-[10px] text-slate-500 font-medium">Repuestos, estanterías, facturas y Kardex</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportPartsCSV}
                className="flex items-center gap-2.5 p-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-left shadow-xs"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-slate-900 font-bold">Excel / CSV de Inventario</div>
                  <div className="text-[10px] text-slate-500 font-medium">Para abrir en Excel o Google Sheets</div>
                </div>
              </button>
            </div>
          </div>

          {/* Import Backup */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block font-mono">
              2. Restaurar desde Copia de Seguridad (.JSON)
            </span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-100 border-2 border-dashed border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              Seleccionar archivo de copia de seguridad (.JSON)
            </button>
          </div>

          {/* Demo Data Reset */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Restablecer a Datos de Prueba
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Restaura el catálogo de ejemplo con repuestos, estanterías, facturas y promociones demo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas restaurar la base de datos de ejemplo? Se sobrescribirán los datos actuales.')) {
                  onResetToDemo();
                  setImportMessage({
                    success: true,
                    text: 'Base de datos de prueba restaurada con éxito.',
                  });
                }
              }}
              className="px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restablecer Demo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
