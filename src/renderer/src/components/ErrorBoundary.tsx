import React, { Component, ErrorInfo, ReactNode } from 'react';
import { makeStyles } from '@fluentui/react-components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const useStyles = makeStyles({
  fullPage: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#FFFFFF',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    padding: '24px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  card: {
    maxWidth: '540px',
    width: '100%',
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: '#334155',
    borderBottomColor: '#334155',
    borderLeftColor: '#334155',
    borderRightColor: '#334155',
    boxSizing: 'border-box',
  },
  icon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: 700,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '13px',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  errorPre: {
    backgroundColor: '#0f172a',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#f87171',
    textAlign: 'left',
    overflowX: 'auto',
    maxHeight: '120px',
    margin: '0 0 20px 0',
  },
  btnRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  reloadBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
});

function ErrorFallbackView({
  error,
  onReload,
}: {
  error: Error | null;
  onReload: () => void;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.fullPage}>
      <div className={styles.card}>
        <div className={styles.icon}>⚠️</div>
        <h2 className={styles.title}>
          Omnipos Interface Recovery
        </h2>
        <p className={styles.subtitle}>
          A temporary display error occurred while rendering this screen.
        </p>
        {error && (
          <pre className={styles.errorPre}>
            {error.message}
          </pre>
        )}
        <div className={styles.btnRow}>
          <button
            type="button"
            onClick={onReload}
            className={styles.reloadBtn}
          >
            Reload Omnipos
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Omnipos ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.hash = '#/pos/fastfood';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallbackView
          error={this.state.error}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}
