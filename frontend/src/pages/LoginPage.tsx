import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useTenant } from "../contexts/TenantContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
          {tenant?.company_title || "Billing App"}
        </h1>
        {tenant?.name && <p className="text-center text-gray-500 mb-4 text-sm">Welcome to {tenant.name}</p>}
        <LoginForm onLogin={() => navigate("/")} />
      </div>
    </div>
  );
}
