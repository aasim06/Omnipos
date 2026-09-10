import React from 'react';
import { Quotation } from '@shared/types';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { formatPKR } from '@/lib/utils';
import { Printer, X, FileText } from 'lucide-react';

interface QuotationPrintTemplateProps {
  quotation: Quotation;
  storeSettings?: StoreSettings;
  onClose: () => void;
  onPrint?: () => void;
}

// Convert numbers to English words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return `${inWords(rounded)} Rupees Only`;
}

export const QuotationPrintTemplate: React.FC<QuotationPrintTemplateProps> = ({
  quotation,
  storeSettings,
  onClose,
  onPrint,
}) => {
  const storeName = storeSettings?.storeName || 'OmniPos Retail & Solutions';
  const storePhone = storeSettings?.phone || '+92 300 1234567';
  const storeAddress = storeSettings?.address || 'Main Commercial Area';
  const headerNote = storeSettings?.headerNote || 'Quality Products • Reliable Service';

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const createdDate = new Date(quotation.createdAt).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const validDate = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '7 Days from Issue';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        padding: '24px 16px',
      }}
    >
      {/* Top action toolbar (hidden on print) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          backgroundColor: '#1E293B',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={20} color="#38BDF8" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>
            Print Estimate / Quotation ({quotation.quoteNumber})
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: quotation.status === 'converted' ? '#10B981' : '#F59E0B',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {quotation.status}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleNativePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#E51937',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(229,25,55,0.4)',
            }}
          >
            <Printer size={16} />
            Print A4 / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#334155',
              color: '#F1F5F9',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
            Close
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4) */}
      <div
        id="quotation-print-area"
        style={{
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
          borderRadius: '4px',
          padding: '40px 48px',
          boxSizing: 'border-box',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '12px',
          lineHeight: 1.5,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2.5px solid #E51937',
            paddingBottom: '20px',
            marginBottom: '20px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.5px',
              }}
            >
              {storeName}
            </h1>
            <div style={{ color: '#E51937', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
              {headerNote}
            </div>
            <div style={{ color: '#475569', fontSize: '11.5px', marginTop: '4px' }}>
              {storeAddress}
            </div>
            <div style={{ color: '#475569', fontSize: '11.5px' }}>
              <strong>Phone:</strong> {storePhone}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 900,
                color: '#E51937',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              PRICE QUOTATION
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              ESTIMATE / PROFORMA
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748B' }}>Quote #: </span>
                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{quotation.quoteNumber}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Date: </span>
                <strong style={{ color: '#0F172A' }}>{createdDate}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Valid Till: </span>
                <strong style={{ color: '#E51937' }}>{validDate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Box */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '22px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quotation Prepared For:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {quotation.customerName || 'Valued Customer'}
            </div>
            {quotation.customerPhone && (
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                <strong>Mobile:</strong> {quotation.customerPhone}
              </div>
            )}
            {quotation.customerAddress && (
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '1px' }}>
                <strong>Address:</strong> {quotation.customerAddress}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', minWidth: '180px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Status & Currency
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              PKR (Pakistani Rupee)
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              Terms: Advance / Cash on Delivery
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px', fontSize: '11px', fontWeight: 700 }}>
                #
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>
                Item Description / Specifications
              </th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px', fontSize: '11px', fontWeight: 700 }}>
                Qty
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 700 }}>
                Unit Rate (PKR)
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px', fontSize: '11px', fontWeight: 700 }}>
                Amount (PKR)
              </th>
            </tr>
          </thead>
          <tbody>
            {quotation.lines.map((line, idx) => {
              const lineTotal = line.quantity * line.unitPrice;
              return (
                <tr
                  key={`${line.productId}_${idx}`}
                  style={{
                    borderBottom: '1px solid #E2E8F0',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                  }}
                >
                  <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '12.5px' }}>
                      {line.name}
                    </div>
                    {line.variantLabel && (
                      <div style={{ fontSize: '11px', color: '#E51937', fontWeight: 600 }}>
                        Spec / Size: {line.variantLabel}
                      </div>
                    )}
                    {line.notes && (
                      <div style={{ fontSize: '10.5px', color: '#64748B', fontStyle: 'italic' }}>
                        Note: {line.notes}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: '12.5px' }}>
                    {line.quantity}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                    {line.unitPrice.toLocaleString('en-PK')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0F172A' }}>
                    {lineTotal.toLocaleString('en-PK')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Calculation Summary Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
          {/* Left Column: In Words & Notes */}
          <div style={{ flex: 1, paddingRight: '30px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Amount in Words:
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', fontStyle: 'italic', marginTop: '2px' }}>
              {numberToWords(quotation.totalAmount)}
            </div>

            {quotation.notes && (
              <div style={{ marginTop: '14px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#334155' }}>Customer Note: </span>
                <span style={{ fontSize: '11.5px', color: '#475569' }}>{quotation.notes}</span>
              </div>
            )}
          </div>

          {/* Right Column: Numeric Totals */}
          <div style={{ width: '280px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>Subtotal:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatPKR(quotation.subtotal)}</span>
            </div>

            {quotation.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#16A34A' }}>
                <span>Discount ({quotation.discountPercent}%):</span>
                <span style={{ fontWeight: 700 }}>- {formatPKR(quotation.discountAmount)}</span>
              </div>
            )}

            {quotation.taxAmount && quotation.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>Tax / GST:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatPKR(quotation.taxAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                marginTop: '6px',
                borderTop: '2px solid #E2E8F0',
                fontSize: '15px',
                fontWeight: 900,
                color: '#E51937',
              }}
            >
              <span>TOTAL ESTIMATE:</span>
              <span>{formatPKR(quotation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ maxWidth: '440px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
              Terms & Conditions:
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#64748B', lineHeight: 1.5 }}>
              <li>This quotation is valid until {validDate}. Rates may vary after expiry.</li>
              <li>Goods will be dispatched or installed upon confirmation of purchase order.</li>
              <li>Standard manufacturer warranty applies where indicated.</li>
              <li>{quotation.terms || 'Payment terms: 50% advance, balance upon delivery.'}</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '50px' }} />
            <div style={{ borderTop: '1px solid #0F172A', paddingTop: '4px', fontWeight: 700, fontSize: '11px', color: '#0F172A' }}>
              Authorized Signature / Stamp
            </div>
            <div style={{ fontSize: '9.5px', color: '#94A3B8' }}>For {storeName}</div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #quotation-print-area, #quotation-print-area * {
            visibility: visible;
          }
          #quotation-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
