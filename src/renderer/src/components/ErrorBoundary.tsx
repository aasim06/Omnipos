import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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
        <div
          style={{
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
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              backgroundColor: '#1e293b',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              border: '1px solid #334155',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>
              Omnipos Interface Recovery
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              A temporary display error occurred while rendering this screen.
            </p>
            {this.state.error && (
              <pre
                style={{
                  backgroundColor: '#0f172a',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#f87171',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '120px',
                  margin: '0 0 20px 0',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#E51937',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Reload Omnipos
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
