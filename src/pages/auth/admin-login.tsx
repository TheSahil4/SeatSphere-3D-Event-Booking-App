import { Shield } from 'lucide-react';
import { PortalLogin } from './portal-login';

export default function AdminLogin() {
  return (
    <PortalLogin
      role="admin"
      title="Admin Portal"
      subtitle="Sign in to manage events, venues and staff."
      redirectPath="/admin"
      loginPath="/admin/login"
      icon={<Shield className="h-5 w-5 text-white" />}
      accent="primary"
      demoEmail="admin@seatsphere.demo"
    />
  );
}
