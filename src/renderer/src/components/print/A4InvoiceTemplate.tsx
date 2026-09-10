import React from 'react';
import { Order } from '@shared/types';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { formatPKR } from '@/lib/utils';
import { Printer, X, Receipt } from 'lucide-react';

interface A4InvoiceTemplateProps {
  order: Order;
  storeSettings?: StoreSettings;
  cashierName?: string;
  paymentMode?: string;
  tenderedAmount?: number;
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

export const A4InvoiceTemplate: React.FC<A4InvoiceTemplateProps> = ({
  order,
  storeSettings,
  cashierName = 'Counter Cashier',
  paymentMode = 'Cash',
  tenderedAmount,
  onClose,
  onPrint,
}) => {
  const storeName = storeSettings?.storeName || 'OmniPos Store & Solutions';
  const storePhone = storeSettings?.phone || '+92 300 1234567';
  const storeAddress = storeSettings?.address || 'Main Commercial Area';
  const headerNote = storeSettings?.headerNote || 'Quality Products • Professional Service';

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const orderTime = new Date(order.createdAt).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subtotal = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const total = order.totalAmount || subtotal;
  const discountAmount = Math.max(0, subtotal - total);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

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
      {/* Top Toolbar */}
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
          color: '#FFFFFF',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Receipt size={20} color="#10B981" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>
            A4 Commercial Invoice (#{order.id})
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {order.stage}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handlePrint}
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

      {/* A4 Sheet Paper */}
      <div
        id="a4-invoice-print-area"
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
        {/* Header Block */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2.5px solid #0F172A',
            paddingBottom: '18px',
            marginBottom: '18px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>
              {storeName}
            </h1>
            <div style={{ color: '#E51937', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>
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
                color: '#0F172A',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              COMMERCIAL INVOICE
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              TAX INVOICE / CASH BILL
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748B' }}>Invoice #: </span>
                <strong style={{ color: '#E51937', fontSize: '13px' }}>{order.id}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Date & Time: </span>
                <strong style={{ color: '#0F172A' }}>{orderDate} • {orderTime}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Cashier: </span>
                <strong style={{ color: '#0F172A' }}>{cashierName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Payment Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              Billed To Customer:
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {order.customerName || 'Walking Customer'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Sale Type: <strong style={{ textTransform: 'capitalize', color: '#334155' }}>{order.orderType || 'Retail POS'}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
              Payment Information:
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              Paid Via: <span style={{ color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>{paymentMode}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Status: <strong>PAID & FULFILLED</strong>
            </div>
          </div>
        </div>

        {/* Table of Items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '40px', fontSize: '11px', fontWeight: 700 }}>#</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700 }}>Item Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px', fontSize: '11px', fontWeight: 700 }}>Qty</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 700 }}>Rate (PKR)</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', width: '120px', fontSize: '11px', fontWeight: 700 }}>Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, idx) => {
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
                        Spec: {line.variantLabel}
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

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Amount in Words:
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', fontStyle: 'italic', marginTop: '2px' }}>
              {numberToWords(total)}
            </div>

            <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
              <strong>Notice:</strong> Goods once sold will not be refunded without original receipt. Warranty claims handled as per vendor terms.
            </div>
          </div>

          <div style={{ width: '270px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' }}>
              <span style={{ color: '#64748B' }}>Gross Total:</span>
              <span style={{ fontWeight: 700 }}>{formatPKR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: '#16A34A' }}>
                <span>Discount Applied:</span>
                <span style={{ fontWeight: 700 }}>- {formatPKR(discountAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                marginTop: '6px',
                borderTop: '2px solid #E2E8F0',
                fontSize: '15px',
                fontWeight: 900,
                color: '#E51937',
              }}
            >
              <span>NET PAYABLE:</span>
              <span>{formatPKR(total)}</span>
            </div>

            {typeof tenderedAmount === 'number' && tenderedAmount >= total && (
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #CBD5E1', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Amount Tendered:</span>
                  <span>{formatPKR(tenderedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 700 }}>
                  <span>Change Returned:</span>
                  <span>{formatPKR(tenderedAmount - total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Signatures */}
        <div
          style={{
            marginTop: '36px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '4px', fontSize: '11px', color: '#64748B' }}>
              Customer's Signature
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ borderTop: '1px solid #0F172A', paddingTop: '4px', fontWeight: 700, fontSize: '11px', color: '#0F172A' }}>
              Authorized Signature / Stamp
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-invoice-print-area, #a4-invoice-print-area * {
            visibility: visible;
          }
          #a4-invoice-print-area {
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
