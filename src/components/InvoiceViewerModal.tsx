import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Receipt,
  CheckCircle2,
  Share2,
  Download,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  ShieldCheck,
  Tag,
  MapPin,
  Loader2
} from 'lucide-react';
import { SaleInvoice } from '../types';
import { downloadElementAsPdf } from '../utils/pdfExport';

interface InvoiceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SaleInvoice | null;
}

export const InvoiceViewerModal: React.FC<InvoiceViewerModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'TICKET'>('A4');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const isElectronic = invoice.type === 'ELECTRONIC';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsDownloadingPdf(true);
      setDownloadSuccess(false);
      setDownloadError(null);
      const safeNum = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `factura_${safeNum}_${printFormat.toLowerCase()}.pdf`;
      await downloadElementAsPdf(printRef.current, {
        filename,
        orientation: 'portrait',
        format: printFormat === 'A4' ? 'a4' : 'ticket',
        marginMm: printFormat === 'A4' ? 10 : 3,
        fitToPage: printFormat === 'A4',
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      setDownloadError('No se pudo generar el archivo PDF automáticamente. Puedes usar el botón "Imprimir" y seleccionar "Guardar como PDF".');
      setTimeout(() => setDownloadError(null), 6000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo';
      case 'CARD':
        return 'Tarjeta Débito/Crédito';
      case 'TRANSFER':
        return 'Transferencia Bancaria';
      case 'CREDIT':
        return 'Crédito a Plazos';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white border-2 border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black print:w-full print:max-w-none print:static">
        {/* Modal Header & Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                isElectronic
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {isElectronic ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono">
                  {invoice.invoiceNumber}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    isElectronic
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isElectronic ? 'Factura Electrónica' : 'Factura Manual'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(invoice.createdAt).toLocaleString()} • Cliente: {invoice.customerName}
              </p>
            </div>
          </div>

          {/* Format Switcher & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintFormat('A4')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  printFormat === 'A4'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Carta / A4</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('TICKET')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  printFormat === 'TICKET'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Ticket POS</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 ${
                downloadSuccess ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? 'Generando...' : downloadSuccess ? '¡PDF Descargado!' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-300 shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="mx-6 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-medium print:hidden">
            ⚠️ {downloadError}
          </div>
        )}

        {/* Invoice View Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* FORMAT A4: Full Official Document Sheet */}
          {printFormat === 'A4' && (
            <div
              ref={printRef}
              className="bg-white border border-slate-300 rounded-lg p-6 sm:p-7 w-full max-w-[760px] shadow-md text-slate-900 space-y-5 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full"
            >
              {/* Top Business Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                      AG
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                      AUTOPART <span className="text-blue-600">GRID</span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Distribuidora y Almacén Central de Autopartes S.A.S.
                  </p>
                  <p className="text-[11px] text-slate-500">NIT 901.450.880-9 • IVA Régimen Común</p>
                  <p className="text-[11px] text-slate-500">Av. Industrial Automotriz # 45-80, Almacén Central</p>
                  <p className="text-[11px] text-slate-500">PBX: (604) 448-9000 • ventas@autopartgrid.com</p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-3 rounded-lg border border-slate-200 w-full sm:w-auto">
                  <span
                    className={`text-[11px] uppercase font-bold tracking-wider block font-mono ${
                      isElectronic ? 'text-blue-700' : 'text-amber-700'
                    }`}
                  >
                    {isElectronic ? 'Factura Electrónica de Venta' : 'Factura Manual / Mostrador'}
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha: <span className="font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Hora: <span className="font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Tax Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Datos del Cliente
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
                  <div className="text-slate-600 font-mono">
                    <span className="font-semibold">Doc / NIT:</span> {invoice.customerDocument}
                  </div>
                  {invoice.customerAddress && (
                    <div className="text-slate-600">
                      <span className="font-semibold">Dirección:</span> {invoice.customerAddress}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Condiciones Comerciales
                  </span>
                  <div className="text-slate-700">
                    <span className="font-semibold">Forma de Pago:</span>{' '}
                    <span className="font-bold text-slate-900">{getPaymentMethodLabel(invoice.paymentMethod)}</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-semibold">Estado:</span>{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pagado / Aprobado
                    </span>
                  </div>
                  {invoice.customerEmail && (
                    <div className="text-slate-600">
                      <span className="font-semibold">Email:</span> {invoice.customerEmail}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Cant</th>
                      <th className="py-2.5 px-3">Descripción / Repuesto</th>
                      <th className="py-2.5 px-3 font-mono">SKU / Ubicación</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-3 text-center">Desc.</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(invoice.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.partName}</div>
                          <div className="text-[11px] text-slate-500">{item.brand} • {item.category}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          <div>{item.sku}</div>
                          <span className="text-blue-600 font-semibold">{item.locationBin}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t-2 border-slate-300">
                <div className="text-xs text-slate-500 max-w-sm space-y-1">
                  <p className="font-semibold text-slate-700">Notas / Observaciones:</p>
                  <p className="italic text-slate-600">
                    {invoice.notes || 'Garantía legal de 90 días por defectos de fabricación con presentación de este comprobante.'}
                  </p>
                </div>

                <div className="w-full sm:w-64 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuentos:</span>
                      <span>-${invoice.discountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>IVA ({invoice.taxPercent}%):</span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300 font-sans">
                    <span>TOTAL A PAGAR:</span>
                    <span className="font-mono text-base text-blue-600">${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Electronic Stamp & CUFE/QR Footer */}
              {isElectronic && invoice.electronicDetails && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3.5 text-xs font-mono">
                  <div className="p-2 bg-white border border-slate-300 rounded shadow-xs shrink-0 flex flex-col items-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                    <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Verificar DIAN</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 flex-1 min-w-0">
                    <div className="font-bold text-blue-700 uppercase font-sans">
                      ✓ Comprobante Electrónico Válido y Certificado
                    </div>
                    <div className="break-all">
                      <span className="font-bold text-slate-700">CUFE / Autorización:</span>{' '}
                      {invoice.electronicDetails.authorizationCode}
                    </div>
                    <div className="break-all">
                      <span className="font-bold text-slate-700">Firma Digital:</span>{' '}
                      {invoice.electronicDetails.digitalStamp}
                    </div>
                    <div className="break-all">
                      <span className="font-bold text-slate-700">Resolución DIAN:</span>{' '}
                      {invoice.electronicDetails.resolutionNumber}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FORMAT TICKET: POS Thermal Printer (80mm) */}
          {printFormat === 'TICKET' && (
            <div
              ref={printRef}
              className="bg-white border border-slate-300 p-4 w-72 shadow-md text-slate-900 font-mono text-[11px] space-y-3 print:shadow-none print:border-none"
            >
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-sm font-sans">AUTOPART GRID</div>
                <div className="text-[10px] font-sans">ALMACÉN DE REPUESTOS</div>
                <div className="text-[10px]">NIT: 901.450.880-9</div>
                <div className="text-[10px]">PBX: (604) 448-9000</div>
              </div>

              {/* Invoice Meta */}
              <div className="border-b border-dashed border-slate-400 pb-2 text-[10px] space-y-0.5">
                <div>
                  <span className="font-bold">{isElectronic ? 'FACTURA ELECTRÓNICA' : 'VENTA MOSTRADOR'}</span>
                </div>
                <div>No: <span className="font-bold">{invoice.invoiceNumber}</span></div>
                <div>Fecha: {new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div>Cliente: <span className="font-semibold">{invoice.customerName}</span></div>
                <div>NIT/Doc: {invoice.customerDocument}</div>
                <div>Pago: {getPaymentMethodLabel(invoice.paymentMethod)}</div>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1.5">
                <div className="font-bold grid grid-cols-12 text-[10px]">
                  <span className="col-span-2">CANT</span>
                  <span className="col-span-6">DESCRIPCIÓN</span>
                  <span className="col-span-4 text-right">TOTAL</span>
                </div>
                {(invoice.items || []).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px]">
                    <span className="col-span-2">{item.quantity}</span>
                    <div className="col-span-6 leading-tight">
                      <div className="font-bold truncate">{item.partName}</div>
                      <div className="text-[9px] text-slate-500">[{item.locationBin}]</div>
                    </div>
                    <span className="col-span-4 text-right font-bold">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Descuento:</span>
                    <span>-${invoice.discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA ({invoice.taxPercent}%):</span>
                  <span>${invoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-400">
                  <span>TOTAL:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Stamp / QR */}
              {isElectronic && invoice.electronicDetails ? (
                <div className="text-center space-y-1 pt-1">
                  <div className="flex justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-tight">
                    CUFE: {invoice.electronicDetails.authorizationCode.slice(0, 20)}...
                  </div>
                  <div className="text-[10px] font-sans font-bold text-slate-800">
                    ¡Gracias por su compra!
                  </div>
                </div>
              ) : (
                <div className="text-center text-[10px] pt-1">
                  ¡Gracias por su compra en AutoStock!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <span>
            Ganancia bruta estimada en esta venta:{' '}
            <strong className="text-emerald-700 font-mono">${invoice.grossProfit.toFixed(2)}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className={`px-3 py-1.5 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                downloadSuccess ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'Generando...' : downloadSuccess ? '¡PDF Descargado!' : 'Descargar PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
