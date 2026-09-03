import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Barcode as BarcodeIcon, MapPin, Tag, Download, Loader2 } from 'lucide-react';
import { AutoPart, RackConfig } from '../types';
import { formatBinCode, renderBarcodeToElement } from '../utils/barcode';
import { downloadElementAsPdf } from '../utils/pdfExport';

export type PrintLabelItem = {
  id: string;
  title: string;
  subtitle?: string;
  barcodeValue: string;
  locationCode?: string;
  price?: number;
  sku?: string;
  type: 'PART' | 'BIN_LOCATION';
};

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PrintLabelItem[];
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // Render barcodes after modal mounts
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setTimeout(() => {
        items.forEach((item) => {
          const svgEl = document.getElementById(`barcode-svg-${item.id}`) as unknown as SVGElement | null;
          if (svgEl) {
            renderBarcodeToElement(svgEl, item.barcodeValue, {
              height: item.type === 'BIN_LOCATION' ? 45 : 35,
              width: item.type === 'BIN_LOCATION' ? 2 : 1.6,
              fontSize: 12,
            });
          }
        });
      }, 100);
    }
  }, [isOpen, items]);

  if (!isOpen || items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!containerRef.current) return;
    try {
      setIsDownloadingPdf(true);
      const filename = items[0]?.type === 'BIN_LOCATION'
        ? 'etiquetas-canastas-estanterias.pdf'
        : 'etiquetas-codigos-barras.pdf';
      await downloadElementAsPdf(containerRef.current, {
        filename,
        orientation: 'portrait',
        format: 'a4',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el archivo PDF. Intenta de nuevo.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Header (Hidden during print) */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Impresión de Etiquetas de Código de Barras
              </h2>
              <p className="text-xs text-slate-500">
                {items.length} etiqueta(s) listas para imprimir en hojas adhesivas o rótulos de canasta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Labels Grid Preview Container */}
        <div
          ref={containerRef}
          className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 print:bg-white print:p-0 print:overflow-visible"
        >
          <div className="print:hidden bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span>
              💡 <strong>Tip de almacén:</strong> Puedes pegar estas etiquetas directamente en el borde plástico de cada canasta para escanear con la pistola al despachar.
            </span>
          </div>

          {/* Printable Sheet Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-4 print:p-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-white text-slate-900 p-4 rounded-xl border-2 shadow-xs flex flex-col justify-between items-center text-center page-break-inside-avoid ${
                  item.type === 'BIN_LOCATION'
                    ? 'border-blue-500 border-dashed bg-blue-50/20'
                    : 'border-slate-300'
                }`}
                style={{ minHeight: '180px' }}
              >
                {/* Top Title */}
                <div className="w-full">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200 pb-1 mb-1.5 font-mono">
                    <span className="font-mono">{item.sku || 'CANASTA UBICACIÓN'}</span>
                    {item.locationCode && (
                      <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {item.locationCode}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* SVG Barcode */}
                <div className="my-2 w-full flex justify-center">
                  <svg id={`barcode-svg-${item.id}`} className="max-w-full" />
                </div>

                {/* Footer details */}
                <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-700 border-t border-slate-200 pt-1 font-mono">
                  <span>AutoStock Almacén</span>
                  {item.price !== undefined && (
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      PVP: ${item.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer for non-print */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-mono">
            Total etiquetas a generar: {items.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
