import React, { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { useLicense, LicenseModules } from '@/features/auth/LicenseModulesContext';
import { useAuth } from '@/features/auth/AuthContext';
import { UserPermissionKey } from '@/features/auth/userStorage';

interface RouteAccessGateProps {
  moduleKey?: keyof LicenseModules;
  permissionKey?: UserPermissionKey;
}

export const MODULE_TO_PERMISSION: Record<keyof LicenseModules, UserPermissionKey> = {
  fastfood: 'pos_fastfood',
  omnimart: 'pos_omnimart',
  kitchen: 'kitchen',
  catalog: 'catalog',
  inventory: 'inventory',
  khata: 'khata',
  expenses: 'expenses',
  reports: 'reports',
  admin: 'admin',
  webStore: 'admin',
};

export function getDefaultAccessibleRoute(
  modules: LicenseModules,
  hasPermission?: (p: UserPermissionKey) => boolean
): string {
  const canPerm = hasPermission ?? (() => true);

  if (modules.fastfood && canPerm('pos_fastfood')) return '/pos/fastfood';
  if (modules.omnimart && canPerm('pos_omnimart')) return '/pos/omnimart';
  if (modules.kitchen && canPerm('kitchen')) return '/kitchen';
  if (modules.catalog && canPerm('catalog')) return '/catalog';
  if (modules.inventory && canPerm('inventory')) return '/inventory';
  if (modules.khata && canPerm('khata')) return '/khata';
  if (modules.expenses && canPerm('expenses')) return '/expenses';
  if (modules.reports && canPerm('reports')) return '/reports';
  if (modules.admin && canPerm('admin')) return '/admin';
  return '/pos/fastfood';
}

export function RouteAccessGate({
  moduleKey,
  permissionKey,
  children,
}: PropsWithChildren<RouteAccessGateProps>): React.JSX.Element {
  const { can, modules } = useLicense();
  const { user, hasPermission } = useAuth();

  // 1. License Gate Check
  if (moduleKey && !can(moduleKey)) {
    const fallbackRoute = getDefaultAccessibleRoute(modules, hasPermission);
    return <Navigate to={fallbackRoute} replace />;
  }

  // 2. User Permission Gate Check (Cashiers only get allowed modules)
  const reqPerm = permissionKey || (moduleKey ? MODULE_TO_PERMISSION[moduleKey] : undefined);
  if (reqPerm && !hasPermission(reqPerm)) {
    const fallbackRoute = getDefaultAccessibleRoute(modules, hasPermission);
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

