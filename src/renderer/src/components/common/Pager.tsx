import React from 'react';
import { Button, tokens } from '@fluentui/react-components';
import { ChevronLeft20Regular, ChevronRight20Regular } from '@fluentui/react-icons';

/**
 * Client-side paging for long tables. Goes back to page 1 whenever `resetKey` changes
 * (typically the search text / filter), and stays on a valid page as the list shrinks.
 */
export function usePaged<T>(items: T[], pageSize = 25, resetKey?: unknown) {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => setPage(1), [resetKey]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    setPage,
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
}: {
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  total: number;
  from: number;
  to: number;
  noun?: string;
}): React.JSX.Element | null {
  if (total <= 0 || pageCount <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '10px 4px 2px',
        color: tokens.colorNeutralForeground3,
        fontSize: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>
        {from}–{to} of {total} {noun}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button size="small" appearance="subtle" icon={<ChevronLeft20Regular />} disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <span>
          Page {page} / {pageCount}
        </span>
        <Button
          size="small"
          appearance="subtle"
          icon={<ChevronRight20Regular />}
          iconPosition="after"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
