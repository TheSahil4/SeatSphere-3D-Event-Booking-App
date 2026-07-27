import { ScanLine } from 'lucide-react';
import { PortalLogin } from './portal-login';

export default function StaffLogin() {
  return (
    <PortalLogin
      role="gate_staff"
      title="Gate Staff Portal"
      subtitle="Sign in to scan and validate tickets."
      redirectPath="/staff"
      loginPath="/staff/login"
      icon={<ScanLine className="h-5 w-5 text-white" />}
      accent="primary"
      demoEmail="staff@seatsphere.demo"
    />
  );
}
