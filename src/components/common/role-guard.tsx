import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types/database';
import { PageLoader } from '@/components/common/page-loader';

interface RoleGuardProps {
  roles: Role[];
  fallback: string;
  children: ReactNode;
}

export function RoleGuard({ roles, fallback, children }: RoleGuardProps) {
  const { loading, user, role } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to={fallback} state={{ from: location.pathname }} replace />;
  }

  if (!role || !roles.includes(role)) {
    // redirect to the right portal based on role
    const home =
      role === 'admin'
        ? '/admin'
        : role === 'manager'
        ? '/manager'
        : role === 'gate_staff'
        ? '/staff'
        : '/dashboard';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
