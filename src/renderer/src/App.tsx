import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { FluentSidebar } from '@/components/FluentSidebar';
import { PosCounterView } from '@/features/pos/PosCounterView';
import { KitchenView } from '@/features/kitchen/KitchenView';
import { KhataView } from '@/features/khata/KhataView';
import { InventoryLayout } from '@/features/inventory/InventoryLayout';
import { InventoryDashboardView } from '@/features/inventory/InventoryDashboardView';
import { StockInView } from '@/features/inventory/StockInView';
import { StockOutView } from '@/features/inventory/StockOutView';
import { VendorsView } from '@/features/inventory/VendorsView';
import { StockLedgerView } from '@/features/inventory/StockLedgerView';
import { ExpensesView } from '@/features/expenses/ExpensesView';
import { ReportsAnalyticsView } from '@/features/reports/ReportsAnalyticsView';
import { WebStoreView } from '@/features/web-store/WebStoreView';
import { AdminSettingsView } from '@/features/admin/AdminSettingsView';
import { ProductsCatalogView } from '@/features/catalog/ProductsCatalogView';
import { CategoriesView } from '@/features/catalog/CategoriesView';
import { AddProductView } from '@/features/catalog/AddProductView';
import { LoginView } from '@/features/auth/LoginView';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { LicenseModulesProvider } from '@/features/auth/LicenseModulesContext';
import { LicensePage } from '@/features/auth/LicensePage';
import { LicenseDisabledOverlay } from '@/features/auth/LicenseDisabledOverlay';
import { RouteAccessGate } from '@/components/RouteAccessGate';

import { getOrCreateBrowserHwid, getWebLicenseApiBase } from '@/lib/webLicense';

export interface PosLicenseGate {
  state: 'ok' | 'none' | 'blocked';
  reason?: string;
  modules?: Record<string, boolean>;
}

function ProtectedShellLayout(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <FluentSidebar />
      <main style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App(): React.JSX.Element {
  const [gate, setGate] = useState<PosLicenseGate | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshGate = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setChecking(true);
    try {
      if (window.posApi?.license?.gate) {
        const next = await window.posApi.license.gate();
        setGate(next);
        if (next.state === 'ok') {
          if ((next as any).businessProfiles) {
            localStorage.setItem('omnipos_business_profiles', JSON.stringify((next as any).businessProfiles));
          }
          if (window.posApi?.getLicenseMeta) {
            try {
              const meta = await window.posApi.getLicenseMeta();
              if (meta?.key) localStorage.setItem('omnipos_active_key', meta.key);
              if (meta?.schemaId) localStorage.setItem('omnipos_active_schema', meta.schemaId);
            } catch {
              /* ignore */
            }
          }
        }
      } else {
        // WEB BROWSER MODE (e.g. running on http://localhost:5174)
        const savedKey = localStorage.getItem('omnipos_active_key');
        if (!savedKey) {
          // No license key saved -> Must show LicensePage activation screen!
          setGate({ state: 'none' });
          return;
        }

        const hwid = getOrCreateBrowserHwid();
        const apiBase = getWebLicenseApiBase();

        try {
          const res = await fetch(`${apiBase}/license/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: savedKey, hwid }),
          });

          if (res.ok) {
            const data = await res.json();
            if (!data.valid) {
              if (data.code === 'not_found' || data.code === 'device') {
                // Key removed or device unlinked
                localStorage.removeItem('omnipos_active_key');
                localStorage.removeItem('omnipos_active_schema');
                setGate({ state: 'none' });
              } else {
                setGate({
                  state: 'blocked',
                  reason: data.error || 'This license has been suspended by the administrator.',
                });
              }
            } else {
              if (data.schemaId) {
                localStorage.setItem('omnipos_active_schema', data.schemaId);
              }
              if (data.modules) {
                localStorage.setItem('omnipos_cached_modules', JSON.stringify(data.modules));
              }
              if (data.businessProfiles) {
                localStorage.setItem('omnipos_business_profiles', JSON.stringify(data.businessProfiles));
              }
              setGate({ state: 'ok', modules: data.modules });
            }
          } else {
            // If offline, check if previously cached as ok
            setGate((prev) => prev ?? { state: 'ok' });
          }
        } catch {
          // Network offline resilience
          setGate((prev) => prev ?? { state: 'ok' });
        }
      }
    } catch {
      setGate((prev: PosLicenseGate | null) => prev ?? { state: 'none' });
    } finally {
      if (!opts?.silent) setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshGate();
  }, [refreshGate]);

  // Live polling: if blocked, check every 10 seconds. If ok, periodic check every 30s.
  useEffect(() => {
    if (gate?.state !== 'blocked' && gate?.state !== 'ok') return;
    const intervalMs = gate.state === 'blocked' ? 10_000 : 30_000;
    const timerId = window.setInterval(() => {
      void refreshGate({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [gate?.state, refreshGate]);

  // Splash Loader while checking terminal license status
  if (gate === null) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 30%, #171b26 0%, #0c0d12 100%)',
          color: '#FFFFFF',
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '20px',
            color: '#FFFFFF',
            boxShadow: '0 0 28px rgba(229, 25, 55, 0.6)',
            marginBottom: '20px',
          }}
        >
          OP
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Omni<span style={{ color: '#FF4D63' }}>Pos</span> Terminal
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Verifying License Security...
        </div>
      </div>
    );
  }

  // Not activated yet -> Show License Page
  if (gate.state === 'none') {
    return <LicensePage onActivated={() => void refreshGate()} />;
  }

  // License blocked / disabled from backend -> Show Disabled Overlay
  if (gate.state === 'blocked') {
    return (
      <LicenseDisabledOverlay
        reason={gate.reason || 'Terminal license disabled by administrator.'}
        checking={checking}
        onCheck={() => void refreshGate()}
      />
    );
  }

  // License Active & Verified -> Run full OmniPos application
  return (
    <LicenseModulesProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route element={<ProtectedShellLayout />}>
            <Route path="/" element={<Navigate to="/pos/fastfood" replace />} />

            {/* Fast Food POS */}
            <Route
              path="/pos/fastfood"
              element={
                <RouteAccessGate moduleKey="fastfood">
                  <PosCounterView module="fastfood" />
                </RouteAccessGate>
              }
            />

            {/* Omnimart POS */}
            <Route
              path="/pos/omnimart"
              element={
                <RouteAccessGate moduleKey="omnimart">
                  <PosCounterView module="minimart" />
                </RouteAccessGate>
              }
            />
            <Route path="/pos/minimart" element={<Navigate to="/pos/omnimart" replace />} />

            {/* Kitchen Display KDS */}
            <Route
              path="/kitchen"
              element={
                <RouteAccessGate moduleKey="kitchen">
                  <KitchenView />
                </RouteAccessGate>
              }
            />

            {/* Khata Ledger */}
            <Route
              path="/khata"
              element={
                <RouteAccessGate moduleKey="khata">
                  <KhataView />
                </RouteAccessGate>
              }
            />

            {/* ── Inventory Hub Routes (5 Sub-routes) ── */}
            <Route
              path="/inventory"
              element={
                <RouteAccessGate moduleKey="inventory">
                  <InventoryLayout />
                </RouteAccessGate>
              }
            >
              <Route index element={<InventoryDashboardView />} />
              <Route path="dashboard" element={<InventoryDashboardView />} />
              <Route path="stock-in" element={<StockInView />} />
              <Route path="stock-out" element={<StockOutView />} />
              <Route path="vendors" element={<VendorsView />} />
              <Route path="ledger" element={<StockLedgerView />} />
            </Route>

            {/* Expenses */}
            <Route
              path="/expenses"
              element={
                <RouteAccessGate moduleKey="expenses">
                  <ExpensesView />
                </RouteAccessGate>
              }
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <RouteAccessGate moduleKey="reports">
                  <ReportsAnalyticsView />
                </RouteAccessGate>
              }
            />

            {/* Products & Catalog */}
            <Route
              path="/catalog"
              element={
                <RouteAccessGate moduleKey="catalog">
                  <ProductsCatalogView />
                </RouteAccessGate>
              }
            />
            <Route
              path="/catalog/fastfood"
              element={
                <RouteAccessGate moduleKey="catalog">
                  <ProductsCatalogView initialTab="fastfood" />
                </RouteAccessGate>
              }
            />
            <Route
              path="/catalog/omnimart"
              element={
                <RouteAccessGate moduleKey="catalog">
                  <ProductsCatalogView initialTab="minimart" />
                </RouteAccessGate>
              }
            />
            <Route
              path="/catalog/categories"
              element={
                <RouteAccessGate moduleKey="catalog">
                  <CategoriesView />
                </RouteAccessGate>
              }
            />
            <Route
              path="/catalog/new"
              element={
                <RouteAccessGate moduleKey="catalog">
                  <AddProductView />
                </RouteAccessGate>
              }
            />

            {/* Web Store */}
            <Route
              path="/web-store"
              element={
                <RouteAccessGate moduleKey="webStore">
                  <WebStoreView />
                </RouteAccessGate>
              }
            />

            {/* Admin Settings */}
            <Route
              path="/admin"
              element={
                <RouteAccessGate moduleKey="admin">
                  <AdminSettingsView />
                </RouteAccessGate>
              }
            />

            <Route path="*" element={<Navigate to="/pos/fastfood" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </LicenseModulesProvider>
  );
}
