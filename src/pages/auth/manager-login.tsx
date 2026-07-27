import { Briefcase } from 'lucide-react';
import { PortalLogin } from './portal-login';

export default function ManagerLogin() {
  return (
    <PortalLogin
      role="manager"
      title="Manager Portal"
      subtitle="Sign in to manage your assigned events."
      redirectPath="/manager"
      loginPath="/manager/login"
      icon={<Briefcase className="h-5 w-5 text-white" />}
      accent="accent"
      demoEmail="manager@seatsphere.demo"
    />
  );
}
