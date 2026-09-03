import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { FluentSidebar } from '@/components/FluentSidebar';
import { PosCounterView } from '@/features/pos/PosCounterView';
import { KitchenView } from '@/features/kitchen/KitchenView';
import { KhataView } from '@/features/khata/KhataView';
import { InventoryView } from '@/features/inventory/InventoryView';
import { ExpensesView } from '@/features/expenses/ExpensesView';
import { ReportsAnalyticsView } from '@/features/reports/ReportsAnalyticsView';
import { WebStoreView } from '@/features/web-store/WebStoreView';
import { AdminSettingsView } from '@/features/admin/AdminSettingsView';
import { ProductsCatalogView } from '@/features/catalog/ProductsCatalogView';
import { LoginView } from '@/features/auth/LoginView';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';

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
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<ProtectedShellLayout />}>
          <Route path="/" element={<Navigate to="/pos/fastfood" replace />} />
          <Route path="/pos/fastfood" element={<PosCounterView module="fastfood" />} />
          <Route path="/pos/omnimart" element={<PosCounterView module="minimart" />} />
          <Route path="/pos/minimart" element={<Navigate to="/pos/omnimart" replace />} />
          <Route path="/kitchen" element={<KitchenView />} />
          <Route path="/khata" element={<KhataView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route path="/expenses" element={<ExpensesView />} />
          <Route path="/reports" element={<ReportsAnalyticsView />} />
          <Route path="/catalog" element={<ProductsCatalogView />} />
          <Route path="/web-store" element={<WebStoreView />} />
          <Route path="/admin" element={<AdminSettingsView />} />
          <Route path="*" element={<Navigate to="/pos/fastfood" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
