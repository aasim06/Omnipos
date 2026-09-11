import React from 'react';
import { makeStyles, mergeClasses } from '@fluentui/react-components';
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
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    color: '#FFFFFF',
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
  statusBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
    color: '#FFFFFF',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statusConverted: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
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
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: '2.5px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E51937',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  storeTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.5px',
  },
  headerNote: {
    color: '#E51937',
    fontWeight: 600,
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
  quotationTitle: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#E51937',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  quotationSubtitle: {
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
  quoteIdText: {
    color: '#0F172A',
    fontSize: '13px',
  },
  quoteDateText: {
    color: '#0F172A',
  },
  quoteValidText: {
    color: '#E51937',
  },
  customerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0', borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '14px 18px',
    marginBottom: '22px',
  },
  customerCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
  sectionSmallHeader: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  customerName: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0F172A',
    marginTop: '2px',
  },
  customerPhoneSub: {
    fontSize: '12px',
    color: '#334155',
    marginTop: '2px',
  },
  customerAddressSub: {
    fontSize: '11.5px',
    color: '#64748B',
    marginTop: '1px',
  },
  statusCurrencyCol: {
    textAlign: 'right',
    minWidth: '180px',
  },
  currencyVal: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A',
    marginTop: '2px',
  },
  termsSub: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px',
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
  lineNotesText: {
    fontSize: '10.5px',
    color: '#64748B',
    fontStyle: 'italic',
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
  summaryBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '12px',
  },
  wordsNoticeCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    paddingRight: '30px',
  },
  wordsLabel: {
    fontSize: '11px',
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
  customerNoteBanner: {
    marginTop: '14px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: '#F1F5F9',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0', borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
  },
  customerNoteLabel: {
    fontWeight: 700,
    fontSize: '11px',
    color: '#334155',
  },
  customerNoteText: {
    fontSize: '11.5px',
    color: '#475569',
  },
  totalsBox: {
    width: '280px',
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
  boldDark: {
    fontWeight: 700,
    color: '#0F172A',
  },
  discountLine: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '12px',
    color: '#16A34A',
  },
  weight700: {
    fontWeight: 700,
  },
  totalEstimateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '8px',
    marginTop: '6px',
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    borderTopColor: '#E2E8F0',
    fontSize: '15px',
    fontWeight: 900,
    color: '#E51937',
  },
  termsBlock: {
    marginTop: '28px',
    paddingTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  termsLeft: {
    maxWidth: '440px',
  },
  termsHeading: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  termsUl: {
    margin: 0,
    paddingLeft: '16px',
    fontSize: '10.5px',
    color: '#64748B',
    lineHeight: 1.5,
  },
  signatureBox: {
    textAlign: 'center',
    minWidth: '180px',
  },
  signatureSpace: {
    height: '50px',
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
  forStoreText: {
    fontSize: '9.5px',
    color: '#94A3B8',
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

export const QuotationPrintTemplate: React.FC<QuotationPrintTemplateProps> = ({
  quotation,
  storeSettings,
  onClose,
  onPrint,
}) => {
  const styles = useStyles();
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
    <div className={styles.backdrop}>
      {/* Top action toolbar (hidden on print) */}
      <div className={mergeClasses('no-print', styles.toolbar)}>
        <div className={styles.toolbarLeft}>
          <FileText size={20} color="#38BDF8" />
          <span className={styles.toolbarTitle}>
            Print Estimate / Quotation ({quotation.quoteNumber})
          </span>
          <span
            className={mergeClasses(
              styles.statusBadge,
              quotation.status === 'converted' ? styles.statusConverted : styles.statusPending
            )}
          >
            {quotation.status}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            onClick={handleNativePrint}
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

      {/* Printable Sheet (Standard A4) */}
      <div
        id="quotation-print-area"
        className={styles.paper}
      >
        {/* Header Section */}
        <div className={styles.headerSection}>
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
            <div className={styles.quotationTitle}>
              PRICE QUOTATION
            </div>
            <div className={styles.quotationSubtitle}>
              ESTIMATE / PROFORMA
            </div>

            <div className={styles.metaBlock}>
              <div>
                <span className={styles.metaLabel}>Quote #: </span>
                <strong className={styles.quoteIdText}>{quotation.quoteNumber}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Date: </span>
                <strong className={styles.quoteDateText}>{createdDate}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Valid Till: </span>
                <strong className={styles.quoteValidText}>{validDate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Box */}
        <div className={styles.customerBox}>
          <div className={styles.customerCol}>
            <div className={styles.sectionSmallHeader}>
              Quotation Prepared For:
            </div>
            <div className={styles.customerName}>
              {quotation.customerName || 'Valued Customer'}
            </div>
            {quotation.customerPhone && (
              <div className={styles.customerPhoneSub}>
                <strong>Mobile:</strong> {quotation.customerPhone}
              </div>
            )}
            {quotation.customerAddress && (
              <div className={styles.customerAddressSub}>
                <strong>Address:</strong> {quotation.customerAddress}
              </div>
            )}
          </div>

          <div className={styles.statusCurrencyCol}>
            <div className={styles.sectionSmallHeader}>
              Status & Currency
            </div>
            <div className={styles.currencyVal}>
              PKR (Pakistani Rupee)
            </div>
            <div className={styles.termsSub}>
              Terms: Advance / Cash on Delivery
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className={styles.itemsTable}>
          <thead>
            <tr className={styles.tableHeadTr}>
              <th className={styles.thIndex}>
                #
              </th>
              <th className={styles.thDesc}>
                Item Description / Specifications
              </th>
              <th className={styles.thQty}>
                Qty
              </th>
              <th className={styles.thRate}>
                Unit Rate (PKR)
              </th>
              <th className={styles.thAmount}>
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
                        Spec / Size: {line.variantLabel}
                      </div>
                    )}
                    {line.notes && (
                      <div className={styles.lineNotesText}>
                        Note: {line.notes}
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

        {/* Calculation Summary Block */}
        <div className={styles.summaryBlock}>
          {/* Left Column: In Words & Notes */}
          <div className={styles.wordsNoticeCol}>
            <div className={styles.wordsLabel}>
              Amount in Words:
            </div>
            <div className={styles.wordsVal}>
              {numberToWords(quotation.totalAmount)}
            </div>

            {quotation.notes && (
              <div className={styles.customerNoteBanner}>
                <span className={styles.customerNoteLabel}>Customer Note: </span>
                <span className={styles.customerNoteText}>{quotation.notes}</span>
              </div>
            )}
          </div>

          {/* Right Column: Numeric Totals */}
          <div className={styles.totalsBox}>
            <div className={styles.totalsLine}>
              <span className={styles.colorMuted}>Subtotal:</span>
              <span className={styles.boldDark}>{formatPKR(quotation.subtotal)}</span>
            </div>

            {quotation.discountAmount > 0 && (
              <div className={styles.discountLine}>
                <span>Discount ({quotation.discountPercent}%):</span>
                <span className={styles.weight700}>- {formatPKR(quotation.discountAmount)}</span>
              </div>
            )}

            {quotation.taxAmount && quotation.taxAmount > 0 && (
              <div className={styles.totalsLine}>
                <span className={styles.colorMuted}>Tax / GST:</span>
                <span className={styles.boldDark}>{formatPKR(quotation.taxAmount)}</span>
              </div>
            )}

            <div className={styles.totalEstimateRow}>
              <span>TOTAL ESTIMATE:</span>
              <span>{formatPKR(quotation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className={styles.termsBlock}>
          <div className={styles.termsLeft}>
            <div className={styles.termsHeading}>
              Terms & Conditions:
            </div>
            <ul className={styles.termsUl}>
              <li>This quotation is valid until {validDate}. Rates may vary after expiry.</li>
              <li>Goods will be dispatched or installed upon confirmation of purchase order.</li>
              <li>Standard manufacturer warranty applies where indicated.</li>
              <li>{quotation.terms || 'Payment terms: 50% advance, balance upon delivery.'}</li>
            </ul>
          </div>

          <div className={styles.signatureBox}>
            <div className={styles.signatureSpace} />
            <div className={styles.authorizedSignLine}>
              Authorized Signature / Stamp
            </div>
            <div className={styles.forStoreText}>For {storeName}</div>
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
