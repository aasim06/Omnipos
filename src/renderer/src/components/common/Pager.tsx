import React from 'react';
import { Button, tokens } from '@fluentui/react-components';
import { ChevronLeft20Regular, ChevronRight20Regular } from '@fluentui/react-icons';

/**
 * Client-side paging for long tables. Goes back to page 1 whenever `resetKey` changes
 * (typically the search text / filter), and stays on a valid page as the list shrinks.
 */
export function usePaged<T>(items: T[], initialPageSize = 25, resetKey?: unknown) {
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    setPage,
    pageSize,
    setPageSize,
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(items.length, start + pageSize),
  };
}

export function Pager({
  page,
  pageCount,
  setPage,
  total,
  from,
  to,
  noun = 'records',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  alwaysShow = true,
}: {
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  total: number;
  from: number;
  to: number;
  noun?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  alwaysShow?: boolean;
}): React.JSX.Element | null {
  if (total <= 0) return null;
  if (!alwaysShow && pageCount <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 8px 4px',
        color: tokens.colorNeutralForeground2,
        fontSize: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>
          Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> {noun}
        </span>
        {onPageSizeChange && pageSize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: tokens.colorNeutralForeground3 }}>
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                color: tokens.colorNeutralForeground1,
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button
          size="small"
          appearance="subtle"
          icon={<ChevronLeft20Regular />}
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          style={{ fontWeight: 500 }}
        >
          Previous
        </Button>
        <span style={{ padding: '0 6px', fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
          Page {page} of {pageCount}
        </span>
        <Button
          size="small"
          appearance="subtle"
          icon={<ChevronRight20Regular />}
          iconPosition="after"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
          style={{ fontWeight: 500 }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
