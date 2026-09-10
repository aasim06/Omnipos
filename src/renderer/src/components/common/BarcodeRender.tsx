import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export interface BarcodeRenderProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'CODE39' | 'UPC';
  width?: number; // width of a single bar (typically 1.2 to 2.2)
  height?: number; // height of the bars in px
  displayValue?: boolean;
  fontSize?: number;
  margin?: number; // quiet zone in px
  background?: string;
  lineColor?: string;
  style?: React.CSSProperties;
}

export const BarcodeRender: React.FC<BarcodeRenderProps> = ({
  value,
  format = 'CODE128',
  width = 1.4,
  height = 36,
  displayValue = false,
  fontSize = 11,
  margin = 8,
  background = '#FFFFFF',
  lineColor = '#000000',
  style,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      const cleanVal = (value || '').trim() || '00000000';
      try {
        JsBarcode(svgRef.current, cleanVal, {
          format: 'CODE128', // Code 128 is universal and reads on all barcode guns
          width,
          height,
          displayValue,
          fontSize,
          margin,
          background,
          lineColor,
          flat: true,
        });
      } catch (err) {
        console.warn('JsBarcode render warning:', err);
        // Fallback: try alphanumeric clean string
        try {
          const fallbackVal = cleanVal.replace(/[^0-9A-Za-z]/g, '') || '00000000';
          JsBarcode(svgRef.current, fallbackVal, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            margin,
          });
        } catch {}
      }
    }
  }, [value, format, width, height, displayValue, fontSize, margin, background, lineColor]);

  return (
    <svg
      ref={svgRef}
      style={{
        display: 'block',
        margin: '0 auto',
        maxWidth: '100%',
        ...style,
      }}
    />
  );
};
