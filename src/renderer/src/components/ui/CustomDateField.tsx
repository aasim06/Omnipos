import React from 'react';
import { Combobox, Option, makeStyles, tokens } from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';

/**
 * Date field built on the Fluent UI DatePicker (calendar flyout, typed input), used everywhere
 * instead of the browser's native date input. Values stay as 'yyyy-mm-dd' strings, the same
 * shape the native input produced, so forms and the database do not change.
 */

export interface CustomDateFieldProps {
  label?: string;
  /** 'yyyy-mm-dd' or '' */
  value?: string | null;
  onChange: (value: string) => void;
  /** 'yyyy-mm-dd' bounds */
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 },
  label: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 400,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.2,
    userSelect: 'none',
  },
  star: { color: '#E51937' },
  picker: { width: '100%' },
  error: { fontSize: '11px', color: '#E51937', marginTop: '3px', fontWeight: 500 },
});

const pad = (n: number) => String(n).padStart(2, '0');

/** 'yyyy-mm-dd' → local Date (midnight), or null */
export function parseIsoDate(value?: string | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** local Date → 'yyyy-mm-dd' */
export function toIsoDate(d?: Date | null): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (d?: Date) => (d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '');

/** Accepts what people type: 31/12/2026, 31-12-2026, 2026-12-31, 31 Dec 2026 */
function parseTyped(text: string): Date | null {
  const t = text.trim();
  if (!t) return null;
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(t);
  if (m) {
    const y = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(y, Number(m[2]) - 1, Number(m[1]));
  }
  m = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(t);
  if (m) {
    const mi = MONTHS.findIndex((x) => x.toLowerCase() === m![2].slice(0, 3).toLowerCase());
    if (mi >= 0) return new Date(Number(m[3]), mi, Number(m[1]));
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function CustomDateField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'dd Mon yyyy',
  required,
  error,
  disabled,
  className,
  'aria-label': ariaLabel,
}: CustomDateFieldProps): React.JSX.Element {
  const styles = useStyles();
  return (
    <div className={className ? `${styles.container} ${className}` : styles.container}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.star}>*</span>}
        </span>
      )}
      <DatePicker
        className={styles.picker}
        value={parseIsoDate(value)}
        onSelectDate={(d) => onChange(toIsoDate(d ?? null))}
        formatDate={formatDate}
        parseDateFromString={(t) => parseTyped(t) ?? (null as unknown as Date)}
        allowTextInput
        showGoToToday
        minDate={parseIsoDate(min) ?? undefined}
        maxDate={parseIsoDate(max) ?? undefined}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel || label}
        appearance="outline"
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`);
const timeLabel = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
};
/** '3:05 pm', '15:05', '1505' → '15:05' */
function parseTime(text: string): string | null {
  const t = text.trim().toLowerCase();
  const m = /^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

export interface CustomDateTimeFieldProps {
  label?: string;
  /** 'yyyy-mm-ddTHH:mm' or '' (the shape the native datetime-local input used) */
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Date (Fluent DatePicker) and time (Fluent Combobox, 15-minute steps or typed) together. */
export function CustomDateTimeField({ label, value, onChange, disabled }: CustomDateTimeFieldProps): React.JSX.Element {
  const styles = useStyles();
  const [datePart, timePart] = String(value || '').split('T');
  const time = (timePart || '').slice(0, 5);
  const [typed, setTyped] = React.useState<string | null>(null);
  const emit = (d: string, t: string) => onChange(d ? `${d}T${t || '00:00'}` : '');
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 8 }}>
        <CustomDateField value={datePart || ''} onChange={(d) => emit(d, time)} disabled={disabled} aria-label={`${label || 'Date'} (date)`} />
        <Combobox
          freeform
          disabled={disabled}
          aria-label={`${label || 'Date'} (time)`}
          placeholder="Time"
          value={typed ?? (time ? timeLabel(time) : '')}
          selectedOptions={time ? [time] : []}
          onOptionSelect={(_, data) => {
            setTyped(null);
            if (data.optionValue) emit(datePart || toIsoDate(new Date()), data.optionValue);
          }}
          onChange={(e) => setTyped((e.target as HTMLInputElement).value)}
          onBlur={() => {
            if (typed === null) return;
            const t = parseTime(typed);
            setTyped(null);
            if (t) emit(datePart || toIsoDate(new Date()), t);
          }}
        >
          {TIME_OPTIONS.map((t) => (
            <Option key={t} value={t}>
              {timeLabel(t)}
            </Option>
          ))}
        </Combobox>
      </div>
    </div>
  );
}
