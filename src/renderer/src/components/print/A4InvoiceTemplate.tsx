import React from 'react';
import { makeStyles, mergeClasses } from '@fluentui/react-components';
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

const useStyles = makeStyles({
  backdrop: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    padding: '24px 16px',
  },
  toolbar: {
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
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toolbarTitle: {
    fontWeight: 700,
    fontSize: '15px',
  },
  stageBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  toolbarRight: {
    display: 'flex',
    gap: '10px',
  },
  printBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(229,25,55,0.4)',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#334155',
    color: '#F1F5F9',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
  paper: {
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
  },
  headerBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: '2.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#0F172A',
    paddingBottom: '18px',
    marginBottom: '18px',
  },
  storeTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 900,
    color: '#0F172A',
  },
  headerNote: {
    color: '#E51937',
    fontWeight: 700,
    fontSize: '11px',
    marginTop: '2px',
  },
  storeAddress: {
    color: '#475569',
    fontSize: '11.5px',
    marginTop: '4px',
  },
  storePhone: {
    color: '#475569',
    fontSize: '11.5px',
  },
  textRight: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#0F172A',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  invoiceSubtitle: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600,
  },
  metaBlock: {
    marginTop: '12px',
    fontSize: '12px',
  },
  metaLabel: {
    color: '#64748B',
  },
  invoiceIdBold: {
    color: '#E51937',
    fontSize: '13px',
  },
  boldDark: {
    color: '#0F172A',
  },
  customerBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0', borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  sectionSmallHeader: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#0F172A',
    marginTop: '2px',
  },
  saleTypeSub: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '2px',
  },
  saleTypeVal: {
    textTransform: 'capitalize',
    color: '#334155',
  },
  paidViaRow: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    marginTop: '2px',
  },
  paidViaText: {
    color: '#10B981',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  statusSub: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '2px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '18px',
  },
  tableHeadTr: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
  },
  thIndex: {
    padding: '8px 10px',
    textAlign: 'center',
    width: '40px',
    fontSize: '11px',
    fontWeight: 700,
  },
  thDesc: {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
  },
  thQty: {
    padding: '8px 10px',
    textAlign: 'center',
    width: '70px',
    fontSize: '11px',
    fontWeight: 700,
  },
  thRate: {
    padding: '8px 12px',
    textAlign: 'right',
    width: '110px',
    fontSize: '11px',
    fontWeight: 700,
  },
  thAmount: {
    padding: '8px 12px',
    textAlign: 'right',
    width: '120px',
    fontSize: '11px',
    fontWeight: 700,
  },
  tableRowEven: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tdIndex: {
    padding: '10px 8px',
    textAlign: 'center',
    color: '#64748B',
    fontWeight: 600,
  },
  tdDesc: {
    padding: '10px 12px',
  },
  lineNameText: {
    fontWeight: 700,
    color: '#0F172A',
    fontSize: '12.5px',
  },
  lineSpecText: {
    fontSize: '11px',
    color: '#E51937',
    fontWeight: 600,
  },
  tdQty: {
    padding: '10px 8px',
    textAlign: 'center',
    fontWeight: 700,
    color: '#0F172A',
    fontSize: '12.5px',
  },
  tdRate: {
    padding: '10px 12px',
    textAlign: 'right',
    color: '#334155',
    fontWeight: 600,
  },
  tdAmount: {
    padding: '10px 12px',
    textAlign: 'right',
    fontWeight: 800,
    color: '#0F172A',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordsNoticeCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    paddingRight: '24px',
  },
  wordsLabel: {
    fontSize: '10.5px',
    color: '#64748B',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  wordsVal: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#0F172A',
    fontStyle: 'italic',
    marginTop: '2px',
  },
  noticeBox: {
    marginTop: '16px',
    fontSize: '11px',
    color: '#64748B',
    lineHeight: 1.4,
  },
  totalsBox: {
    width: '270px',
    backgroundColor: '#F8FAFC',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0', borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  totalsLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px',
  },
  colorMuted: {
    color: '#64748B',
  },
  weight700: {
    fontWeight: 700,
  },
  discountLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px',
    color: '#16A34A',
  },
  netPayableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '6px',
    marginTop: '6px',
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    borderTopColor: '#E2E8F0',
    fontSize: '15px',
    fontWeight: 900,
    color: '#E51937',
  },
  tenderedSection: {
    marginTop: '6px',
    paddingTop: '6px',
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: '#CBD5E1',
    fontSize: '11px',
  },
  tenderedLine: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#475569',
  },
  changeLine: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#16A34A',
    fontWeight: 700,
  },
  signaturesBlock: {
    marginTop: '36px',
    paddingTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBox: {
    textAlign: 'center',
    minWidth: '160px',
  },
  customerSignLine: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#94A3B8',
    paddingTop: '4px',
    fontSize: '11px',
    color: '#64748B',
  },
  authorizedSignLine: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#0F172A',
    paddingTop: '4px',
    fontWeight: 700,
    fontSize: '11px',
    color: '#0F172A',
  },
});

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
  const styles = useStyles();
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
    <div className={styles.backdrop}>
      {/* Top Toolbar */}
      <div className={mergeClasses('no-print', styles.toolbar)}>
        <div className={styles.toolbarLeft}>
          <Receipt size={20} color="#10B981" />
          <span className={styles.toolbarTitle}>
            A4 Commercial Invoice (#{order.id})
          </span>
          <span className={styles.stageBadge}>
            {order.stage}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={handlePrint}
            className={styles.printBtn}
          >
            <Printer size={16} />
            Print A4 / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
          >
            <X size={16} />
            Close
          </button>
        </div>
      </div>

      {/* A4 Sheet Paper */}
      <div
        id="a4-invoice-print-area"
        className={styles.paper}
      >
        {/* Header Block */}
        <div className={styles.headerBlock}>
          <div>
            <h1 className={styles.storeTitle}>
              {storeName}
            </h1>
            <div className={styles.headerNote}>
              {headerNote}
            </div>
            <div className={styles.storeAddress}>
              {storeAddress}
            </div>
            <div className={styles.storePhone}>
              <strong>Phone:</strong> {storePhone}
            </div>
          </div>

          <div className={styles.textRight}>
            <div className={styles.invoiceTitle}>
              COMMERCIAL INVOICE
            </div>
            <div className={styles.invoiceSubtitle}>
              TAX INVOICE / CASH BILL
            </div>

            <div className={styles.metaBlock}>
              <div>
                <span className={styles.metaLabel}>Invoice #: </span>
                <strong className={styles.invoiceIdBold}>{order.id}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Date & Time: </span>
                <strong className={styles.boldDark}>{orderDate} • {orderTime}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Cashier: </span>
                <strong className={styles.boldDark}>{cashierName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Payment Meta */}
        <div className={styles.customerBanner}>
          <div>
            <div className={styles.sectionSmallHeader}>
              Billed To Customer:
            </div>
            <div className={styles.customerName}>
              {order.customerName || 'Walking Customer'}
            </div>
            <div className={styles.saleTypeSub}>
              Sale Type: <strong className={styles.saleTypeVal}>{order.orderType || 'Retail POS'}</strong>
            </div>
          </div>

          <div className={styles.textRight}>
            <div className={styles.sectionSmallHeader}>
              Payment Information:
            </div>
            <div className={styles.paidViaRow}>
              Paid Via: <span className={styles.paidViaText}>{paymentMode}</span>
            </div>
            <div className={styles.statusSub}>
              Status: <strong>PAID & FULFILLED</strong>
            </div>
          </div>
        </div>

        {/* Table of Items */}
        <table className={styles.itemsTable}>
          <thead>
            <tr className={styles.tableHeadTr}>
              <th className={styles.thIndex}>#</th>
              <th className={styles.thDesc}>Item Description</th>
              <th className={styles.thQty}>Qty</th>
              <th className={styles.thRate}>Rate (PKR)</th>
              <th className={styles.thAmount}>Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, idx) => {
              const lineTotal = line.quantity * line.unitPrice;
              return (
                <tr
                  key={`${line.productId}_${idx}`}
                  className={idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
                >
                  <td className={styles.tdIndex}>
                    {idx + 1}
                  </td>
                  <td className={styles.tdDesc}>
                    <div className={styles.lineNameText}>
                      {line.name}
                    </div>
                    {line.variantLabel && (
                      <div className={styles.lineSpecText}>
                        Spec: {line.variantLabel}
                      </div>
                    )}
                  </td>
                  <td className={styles.tdQty}>
                    {line.quantity}
                  </td>
                  <td className={styles.tdRate}>
                    {line.unitPrice.toLocaleString('en-PK')}
                  </td>
                  <td className={styles.tdAmount}>
                    {lineTotal.toLocaleString('en-PK')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div className={styles.totalsRow}>
          <div className={styles.wordsNoticeCol}>
            <div className={styles.wordsLabel}>
              Amount in Words:
            </div>
            <div className={styles.wordsVal}>
              {numberToWords(total)}
            </div>

            <div className={styles.noticeBox}>
              <strong>Notice:</strong> Goods once sold will not be refunded without original receipt. Warranty claims handled as per vendor terms.
            </div>
          </div>

          <div className={styles.totalsBox}>
            <div className={styles.totalsLine}>
              <span className={styles.colorMuted}>Gross Total:</span>
              <span className={styles.weight700}>{formatPKR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className={styles.discountLine}>
                <span>Discount Applied:</span>
                <span className={styles.weight700}>- {formatPKR(discountAmount)}</span>
              </div>
            )}

            <div className={styles.netPayableRow}>
              <span>NET PAYABLE:</span>
              <span>{formatPKR(total)}</span>
            </div>

            {typeof tenderedAmount === 'number' && tenderedAmount >= total && (
              <div className={styles.tenderedSection}>
                <div className={styles.tenderedLine}>
                  <span>Amount Tendered:</span>
                  <span>{formatPKR(tenderedAmount)}</span>
                </div>
                <div className={styles.changeLine}>
                  <span>Change Returned:</span>
                  <span>{formatPKR(tenderedAmount - total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className={styles.signaturesBlock}>
          <div className={styles.signatureBox}>
            <div className={styles.customerSignLine}>
              Customer's Signature
            </div>
          </div>

          <div className={styles.signatureBox}>
            <div className={styles.authorizedSignLine}>
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
