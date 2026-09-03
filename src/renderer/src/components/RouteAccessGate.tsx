import React, { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useLicense, LicenseModules } from '@/features/auth/LicenseModulesContext';

interface RouteAccessGateProps {
  moduleKey?: keyof LicenseModules;
}

export function getDefaultAccessibleRoute(modules: LicenseModules): string {
  if (modules.fastfood) return '/pos/fastfood';
  if (modules.omnimart) return '/pos/omnimart';
  if (modules.kitchen) return '/kitchen';
  if (modules.catalog) return '/catalog';
  if (modules.inventory) return '/inventory';
  if (modules.khata) return '/khata';
  if (modules.expenses) return '/expenses';
  if (modules.reports) return '/reports';
  if (modules.webStore) return '/web-store';
  if (modules.admin) return '/admin';
  return '/pos/fastfood';
}

export function RouteAccessGate({
  moduleKey,
  children,
}: PropsWithChildren<RouteAccessGateProps>): React.JSX.Element {
  const { can, modules } = useLicense();

  if (moduleKey && !can(moduleKey)) {
    const fallbackRoute = getDefaultAccessibleRoute(modules);
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}
