import { PosCounterState } from '@/features/pos/usePosCounter';
import { A4InvoiceTemplate } from '@/components/print/A4InvoiceTemplate';

export function A4InvoiceDialog({ pos }: { pos: PosCounterState }) {
  const {
    lastOrder,
    showA4Invoice,
    setShowA4Invoice,
    paymentMode,
    tenderedAmount,
  } = pos;

  return (
    <>
      {showA4Invoice && lastOrder && (
        <A4InvoiceTemplate
          order={lastOrder}
          paymentMode={paymentMode}
          tenderedAmount={typeof tenderedAmount === 'number' ? tenderedAmount : undefined}
          onClose={() => setShowA4Invoice(false)}
        />
      )}
    </>
  );
}
