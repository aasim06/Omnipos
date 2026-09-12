import React, { createContext, useContext, useState, useRef, useCallback, useId, PropsWithChildren } from 'react';
import {
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  ToastIntent,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  Warning24Regular,
  Info24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  confirmSurface: {
    maxWidth: '460px',
    width: '92vw',
    boxSizing: 'border-box',
    borderRadius: '16px',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  confirmBody: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '20px',
    marginTop: '10px',
    marginBottom: '20px',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'nowrap',
    marginTop: '16px',
  },
  actionButton: {
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minHeight: '36px',
    padding: '0 18px',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#DC2626 !important',
    color: '#FFFFFF !important',
    border: 'none !important',
    fontWeight: '600',
    whiteSpace: 'nowrap !important',
    flexShrink: '0 !important',
    minHeight: '36px',
    padding: '0 18px',
    '&:hover': {
      backgroundColor: '#B91C1C !important',
    },
  },
  successIcon: {
    color: '#16A34A',
  },
  errorIcon: {
    color: '#DC2626',
  },
  warningIcon: {
    color: '#D97706',
  },
  infoIcon: {
    color: '#2563EB',
  },
});

interface ToastOptions {
  title: string;
  body?: string;
  intent?: ToastIntent;
  timeout?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'danger' | 'primary';
}

interface AppNotificationContextValue {
  notify: (options: ToastOptions) => void;
  notifySuccess: (title: string, body?: string) => void;
  notifyError: (title: string, body?: string) => void;
  notifyWarning: (title: string, body?: string) => void;
  notifyInfo: (title: string, body?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AppNotificationContext = createContext<AppNotificationContextValue | null>(null);

export function AppNotificationProvider({ children }: PropsWithChildren): React.JSX.Element {
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const styles = useStyles();

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    intent: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    intent: 'primary',
  });

  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || (options.intent === 'danger' ? 'Delete' : 'Confirm'),
        cancelLabel: options.cancelLabel || 'Cancel',
        intent: options.intent || 'primary',
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
  };

  const notify = useCallback(
    ({ title, body, intent = 'info', timeout = 4000 }: ToastOptions) => {
      const getIcon = () => {
        switch (intent) {
          case 'success':
            return <CheckmarkCircle24Regular className={styles.successIcon} />;
          case 'error':
            return <DismissCircle24Regular className={styles.errorIcon} />;
          case 'warning':
            return <Warning24Regular className={styles.warningIcon} />;
          default:
            return <Info24Regular className={styles.infoIcon} />;
        }
      };

      dispatchToast(
        <Toast>
          <ToastTitle media={getIcon()}>{title}</ToastTitle>
          {body && <ToastBody>{body}</ToastBody>}
        </Toast>,
        { intent, timeout, position: 'top-end' }
      );
    },
    [dispatchToast, styles]
  );

  const notifySuccess = useCallback(
    (title: string, body?: string) => {
      notify({ title, body, intent: 'success' });
    },
    [notify]
  );

  const notifyError = useCallback(
    (title: string, body?: string) => {
      notify({ title, body, intent: 'error', timeout: 6000 });
    },
    [notify]
  );

  const notifyWarning = useCallback(
    (title: string, body?: string) => {
      notify({ title, body, intent: 'warning', timeout: 5000 });
    },
    [notify]
  );

  const notifyInfo = useCallback(
    (title: string, body?: string) => {
      notify({ title, body, intent: 'info' });
    },
    [notify]
  );

  return (
    <AppNotificationContext.Provider
      value={{
        notify,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        confirm,
      }}
    >
      {children}
      <Toaster toasterId={toasterId} position="top-end" />

      {/* Confirmation Modal */}
      <Dialog
        open={confirmState.isOpen}
        onOpenChange={(_, data) => {
          if (!data.open) handleConfirmClose(false);
        }}
      >
        <DialogSurface className={styles.confirmSurface}>
          <DialogTitle className={styles.confirmTitle}>{confirmState.title}</DialogTitle>
          <DialogBody>
            <DialogContent className={styles.confirmBody}>{confirmState.message}</DialogContent>
            <DialogActions className={styles.confirmActions}>
              <Button
                appearance="secondary"
                className={styles.actionButton}
                onClick={() => handleConfirmClose(false)}
              >
                {confirmState.cancelLabel}
              </Button>
              <Button
                appearance="primary"
                className={confirmState.intent === 'danger' ? styles.dangerButton : styles.actionButton}
                onClick={() => handleConfirmClose(true)}
              >
                {confirmState.confirmLabel}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </AppNotificationContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(AppNotificationContext);
  if (!context) {
    throw new Error('useAppToast must be used within an AppNotificationProvider');
  }
  return {
    notify: context.notify,
    notifySuccess: context.notifySuccess,
    notifyError: context.notifyError,
    notifyWarning: context.notifyWarning,
    notifyInfo: context.notifyInfo,
  };
}

export function useConfirmDialog() {
  const context = useContext(AppNotificationContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within an AppNotificationProvider');
  }
  return context.confirm;
}
